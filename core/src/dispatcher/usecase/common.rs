pub(crate) mod vm {
    use std::collections::HashMap;
    use std::path::Path;
    use std::sync::Arc;
    use log::{error, info};

    use proxmox_client::model::{
        CreateVirtualMachine, DownloadImage, DownloadImageContentType, OsType, ParamBuilder,
        ResizeDisk, ScsiHw, StorageContent, VmStatus,
    };
    use proxmox_client::{to_url_encoded, ClientOperations};
    use crate::dispatcher::utils::retry;
    use crate::model::{Cluster, ClusterNode, LogEntry};
    use crate::Repository;


    pub(crate) fn create(
        proxmox_client: &ClientOperations,
        repo: Arc<Repository>,
        cluster: &Cluster,
        node: &ClusterNode,
    ) -> Result<(), String> {
        let os_image_path = download_os_image(proxmox_client, repo, cluster)?;

        proxmox_client.create_virtual_machine(CreateVirtualMachine {
            vm_id: node.vm_id,
            node: cluster.node.clone(),
            name: format!("{}-{}", cluster.cluster_name, node.name),
            cores: node.cores,
            memory: node.memory,
            os_type: OsType::L26,
            net: HashMap::from([(
                "net0".to_owned(),
                ParamBuilder::default()
                    .add_param("model", "virtio")
                    .add_param("bridge", &cluster.network.bridge)
                    .build(),
            )]),
            scsihw: Some(ScsiHw::VirtioScsiPci),
            scsi: HashMap::from([(
                "scsi0".to_owned(),
                ParamBuilder::default()
                    .add_param_with_separator(&node.storage_pool, "0", ":")
                    .add_param("import-from", &os_image_path)
                    .build(),
            )]),
            ide: HashMap::from([(
                "ide2".to_owned(),
                ParamBuilder::default()
                    .add_param_with_separator(&node.storage_pool, "cloudinit", ":")
                    .build(),
            )]),
            boot: Some(ParamBuilder::default().add_param("order", "scsi0").build()),
            vga: Some("serial0".to_string()),
            serial: HashMap::from([("serial0".to_owned(), "socket".to_owned())]),
            ipconfig: HashMap::from([(
                "ipconfig0".to_owned(),
                ParamBuilder::default()
                    .add_param(
                        "ip",
                        format!("{}/{}", node.ip_address, cluster.network.subnet_mask).as_str(),
                    )
                    .add_param("gw", cluster.network.gateway.as_str())
                    .build(),
            )]),
            nameserver: Some(cluster.network.dns.clone()),
            ci_user: Some(cluster.node_username.clone()),
            ci_password: Some(cluster.node_password.clone()),
            ssh_keys: Some(to_url_encoded(&cluster.ssh_key.public_key)),
        })?;

        retry(|| {
            let locked = proxmox_client
                .virtual_machines(&cluster.node, Some(true))?
                .iter()
                .find(|i| i.vm_id == node.vm_id)
                .map(|i| i.lock.is_some())
                .unwrap_or(false);
            if locked {
                Err(format!("VM [{}] is locked", node.vm_id))
            } else {
                Ok(())
            }
        })?;

        proxmox_client.resize_disk(ResizeDisk {
            vm_id: node.vm_id,
            node: cluster.node.clone(),
            disk: "scsi0".to_string(),
            size: format!("{}G", cluster.disk_size),
        })?;
        Ok(())
    }

    fn download_os_image(
        proxmox_client: &ClientOperations,
        repo: Arc<Repository>,
        cluster: &Cluster,
    ) -> Result<String, String> {
        let os_image = cluster.os_image.clone().unwrap_or(
            "https://cloud-images.ubuntu.com/kinetic/current/kinetic-server-cloudimg-amd64.img"
                .to_string(),
        );
        let os_image_storage = cluster
            .os_image_storage
            .clone()
            .unwrap_or("local".to_string());

        let file_name = Path::new(&os_image)
            .file_name()
            .map(|i| i.to_string_lossy().to_string())
            .ok_or("Cannot extract file name for path".to_string())?;

        let get_storage_content = || -> Result<Option<StorageContent>, String> {
            Ok(proxmox_client
                .storage_content(&cluster.node, &os_image_storage)?
                .iter()
                .find(|i| i.volid.ends_with(&file_name))
                .cloned())
        };

        let existing_image = get_storage_content()
            .map_err(|e| format!("Cannot check image availability [{}]", e.to_string()))?;

        let existing_image = match existing_image {
            Some(v) => v,
            None => {
                proxmox_client.download_image(DownloadImage {
                    content: DownloadImageContentType::Iso,
                    filename: file_name.clone(),
                    node: cluster.node.clone(),
                    storage: os_image_storage.clone(),
                    url: os_image,
                    checksum: None,
                    checksum_algorithm: None,
                    verify_certificates: None,
                })?;

                let image = retry(|| {
                    get_storage_content()
                        .map_err(|e| {
                            format!("Cannot check image availability [{}]", e.to_string())
                        })?
                        .ok_or("Cannot download os image".to_string())
                })?;

                repo.save_log(LogEntry::info(
                    &cluster.cluster_name,
                    format!("OS image has been downloaded [{}]", file_name),
                ))?;
                image
            }
        };

        proxmox_client
            .storage_content_details(&cluster.node, &os_image_storage, &existing_image.volid)
            .map(|i| i.path)
            .map_err(|e| e.to_string())
    }

    pub fn wait_for_shutdown(
        proxmox_client: &proxmox_client::ClientOperations,
        node: &str,
        vm_id: u32,
    ) -> Result<bool, String> {
        let is_shutdown = retry(|| {
            let status = proxmox_client
                .status_vm(node, vm_id)
                .map(|i| i.status)
                .map_err(|e| format!("Status VM {}, error: {}", vm_id, e))?;

            match status {
                VmStatus::Running => {
                    info!(
                        "VM [{}] is running, wait 10 sec for gracefully shutdown",
                        vm_id
                    );
                    Err("Running".to_string())
                }
                VmStatus::Stopped => Ok(()),
            }
        });

        match is_shutdown {
            Ok(_) => Ok(true),
            Err(e) => match e.as_str() {
                "Running" => Ok(false),
                _ => Err(e),
            },
        }
    }

    pub fn wait_for_start(
        proxmox_client: &proxmox_client::ClientOperations,
        cluster: &Cluster,
        cluster_node: &ClusterNode,
    ) -> Result<(), String> {
        info!("Wait for VM start");
        retry(|| {
            let status = proxmox_client
                .status_vm(&cluster.node, cluster_node.vm_id)
                .map(|i| i.status)
                .map_err(|e| format!("Status VM [{}], error: {}", cluster_node.vm_id, e))?;

            match status {
                VmStatus::Running => {
                    info!("VM [{}] is running", cluster_node.vm_id);
                    Ok(())
                }
                VmStatus::Stopped => Err(format!("VM [{}] is stopped", cluster_node.vm_id)),
            }
        })?;

        info!("Check cloud-init status for VM [{}]", cluster_node.vm_id);
        retry(|| {
            let mut ssh_client = ssh_client::Client::new();
            ssh_client.connect(
                &cluster_node.ip_address,
                &cluster.node_username,
                &cluster.ssh_key.private_key,
                &cluster.ssh_key.public_key,
            )?;
            ssh_client.execute("cloud-init status --wait")
        })?;
        Ok(())
    }

    pub(crate) fn get_existing_vms(
        proxmox_client: &ClientOperations,
        cluster: &Cluster,
    ) -> Result<Vec<ClusterNode>, String> {
        let vms = proxmox_client
            .virtual_machines(&cluster.node, None)?
            .into_iter()
            .map(|i| (i.vm_id.clone(), i.name.unwrap_or_default()))
            .collect::<Vec<(u32, String)>>();

        let existing_nodes = cluster
            .nodes
            .clone()
            .into_iter()
            .filter(|e| {
                let name = format!("{}-{}", cluster.cluster_name, e.name);
                vms.contains(&(e.vm_id.clone(), name))
            })
            .collect::<Vec<ClusterNode>>();
        Ok(existing_nodes)
    }

    pub(crate) fn stop_vm(
        proxmox_client: &ClientOperations,
        node: &str,
        vm_id: u32,
    ) -> Result<(), String> {
        proxmox_client.shutdown_vm(node, vm_id)?;
        let is_shutdown = wait_for_shutdown(proxmox_client, node, vm_id)?;
        if !is_shutdown {
            info!("Shutdown VM [{}] is timeout, stop VM immediately", vm_id);
            proxmox_client.stop_vm(node, vm_id)?;
            let is_shutdown = wait_for_shutdown(proxmox_client, node, vm_id)?;
            if !is_shutdown {
                error!("Cannot shutdown VM [{}]", vm_id);
                return Err(format!("Cannot shutdown VM [{}]", vm_id));
            }
        }
        Ok(())
    }

    pub(crate) fn restart_vm_if_necessary(
        proxmox_client: &ClientOperations,
        repo: Arc<Repository>,
        cluster: &Cluster,
        node: &ClusterNode,
    ) -> Result<(), String> {
        let mut ssh_client = ssh_client::Client::new();
        ssh_client.connect(
            &node.ip_address,
            &cluster.node_username,
            &cluster.ssh_key.private_key,
            &cluster.ssh_key.public_key,
        )?;
        let is_restart_required = ssh_client.is_file_exists("/var/run/reboot-required")?;
        if !is_restart_required {
            return Ok(());
        }

        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("Reboot is required, shutdown VM [{}]", node.vm_id),
        ))?;

        stop_vm(proxmox_client, &cluster.node, node.vm_id)?;

        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("Starting VM [{}]", node.vm_id),
        ))?;
        proxmox_client.start_vm(&cluster.node, node.vm_id)?;
        wait_for_start(proxmox_client, cluster, node)
            .map_err(|e| format!("Cannot start VM [{}]: {}", node.vm_id, e))?;
        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("VM [{}] has been started", node.vm_id),
        ))?;
        Ok(())
    }

    pub(crate) fn setup_vm(
        cluster: &Cluster,
        node: &ClusterNode,
        hosts: &HashMap<String, String>,
    ) -> Result<(), String> {
        let mut ssh_client = ssh_client::Client::new();
        ssh_client.connect(
            &node.ip_address,
            &cluster.node_username,
            &cluster.ssh_key.private_key,
            &cluster.ssh_key.public_key,
        )?;
        ssh_client.execute("sudo systemctl enable iscsid")?;
        for (host, ip) in hosts.iter() {
            ssh_client.execute(
                format!(
                    "echo '{} {}' | sudo tee -a /etc/cloud/templates/hosts.debian.tmpl",
                    ip, host
                )
                .as_str(),
            )?;
            ssh_client
                .execute(format!("echo '{} {}' | sudo tee -a /etc/hosts", ip, host).as_str())?;
        }
        Ok(())
    }
}

pub(crate) mod cluster {
    use serde::{Deserialize, Serialize};
    use std::sync::Arc;
    use crate::model::{Cluster, ClusterNode, ClusterNodeType, LogEntry};
    use crate::Repository;

    pub(crate) fn install_kubernetes(
        repo: Arc<Repository>,
        cluster: &Cluster,
        node: &ClusterNode,
    ) -> Result<(), String> {
        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("Install Kubernetes on VM [{}]", node.vm_id),
        ))?;
        let mut ssh_client = ssh_client::Client::new();
        ssh_client.connect(
            &node.ip_address,
            &cluster.node_username,
            &cluster.ssh_key.private_key,
            &cluster.ssh_key.public_key,
        )?;
        ssh_client.execute(
            format!(
                "sudo snap install microk8s --channel={} --classic",
                cluster
                    .kube_version
                    .clone()
                    .unwrap_or("1.24/stable".to_owned())
            )
            .as_str(),
        )?;
        Ok(())
    }

    pub(crate) fn wait_for_ready_kubernetes(
        repo: Arc<Repository>,
        cluster: &Cluster,
        node: &ClusterNode,
    ) -> Result<(), String> {
        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("Wait for Kubernetes on VM [{}]", node.vm_id),
        ))?;
        let mut ssh_client = ssh_client::Client::new();
        ssh_client.connect(
            &node.ip_address,
            &cluster.node_username,
            &cluster.ssh_key.private_key,
            &cluster.ssh_key.public_key,
        )?;
        ssh_client.execute("sudo microk8s status --wait-ready")?;
        Ok(())
    }

    #[derive(Serialize, Deserialize)]
    pub(crate) struct JoinNode {
        pub(crate) token: String,
        pub(crate) urls: Vec<String>,
    }

    pub(crate) fn join_node_to_cluster(
        repo: Arc<Repository>,
        cluster: &Cluster,
        master_node: &ClusterNode,
        node_to_join: &ClusterNode,
    ) -> Result<(), String> {
        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("Generate join token on VM [{}] ", master_node.vm_id),
        ))?;

        let mut master_ssh_client = ssh_client::Client::new();
        master_ssh_client.connect(
            &master_node.ip_address,
            &cluster.node_username,
            &cluster.ssh_key.private_key,
            &cluster.ssh_key.public_key,
        )?;
        let token_content = master_ssh_client.execute("sudo microk8s add-node --format json")?;
        let join: JoinNode = serde_json::from_str(&token_content).map_err(|e| e.to_string())?;
        if join.urls.is_empty() {
            return Err("Join token doesn't have urls to join node".to_string());
        }
        let join = join
            .urls
            .first()
            .ok_or("Cannot get url to join".to_string())?;
        let mut worker_ssh_client = ssh_client::Client::new();
        worker_ssh_client.connect(
            &node_to_join.ip_address,
            &cluster.node_username,
            &cluster.ssh_key.private_key,
            &cluster.ssh_key.public_key,
        )?;
        let command = format!("sudo microk8s join {}", join);
        let command = match node_to_join.node_type {
            ClusterNodeType::Master => command,
            ClusterNodeType::Worker => format!("{} --worker", command),
        };

        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!(
                "Join node [{}] with role [{}] to cluster",
                node_to_join.vm_id, node_to_join.node_type
            ),
        ))?;
        worker_ssh_client.execute(command.as_str())?;
        // master_ssh_client.execute(
        //     format!("sudo microk8s.kubectl label node {}-{} node-role.kubernetes.io/{}={}",
        //             cluster.cluster_name,
        //             node_to_join.name,
        //             node_to_join.node_type,
        //             node_to_join.node_type).as_str())?;
        Ok(())
    }
}

pub(crate) mod apps {
    use crate::model::{ClusterResource, HelmApp};

    pub const HELM_CMD: &str = "microk8s.helm3";


    pub fn install_helm_app(ssh_client: &ssh_client::Client, app: &HelmApp) -> Result<(), String> {
        let values_file_name = app.release_name.trim().replace(" ", "_");

        ssh_client.execute(
            &helm_client::new(HELM_CMD)
                .sudo()
                .repo()
                .add(&app.chart_name, &app.repository)
                .build(),
        )?;

        ssh_client.execute(&helm_client::new(HELM_CMD).sudo().repo().update().build())?;

        if !app.values.is_empty() {
            ssh_client.upload_file(
                format!("/tmp/{}.yaml", values_file_name).as_str(),
                &app.values,
            )?;
        }

        let mut command_builder = helm_client::new(HELM_CMD)
            .sudo()
            .upgrade_or_install()
            .create_namespace()
            .namespace(&app.namespace)
            .name(&app.release_name)
            .chart(&app.chart_name, &app.chart_name);

        if !app.values.is_empty() {
            command_builder =
                command_builder.with_values_file(&format!("/tmp/{}.yaml", values_file_name));
        }
        if !app.chart_version.is_empty() {
            command_builder = command_builder.version(&app.chart_version);
        }
        if app.wait {
            command_builder = command_builder.wait();
        }
        ssh_client.execute(&command_builder.build())?;

        if !app.values.is_empty() {
            ssh_client.execute(format!("sudo rm /tmp/{}.yaml", values_file_name).as_str())?;
        }
        Ok(())
    }

    pub fn install_cluster_resource(
        ssh_client: &ssh_client::Client,
        resource: &ClusterResource,
    ) -> Result<(), String> {
        let file_name = format!(
            "{}_cluster_resource",
            resource.name.trim().replace(" ", "_")
        );
        ssh_client.upload_file(
            format!("/tmp/{}.yaml", file_name).as_str(),
            resource.content.as_str(),
        )?;
        ssh_client
            .execute(format!("sudo microk8s.kubectl apply -f /tmp/{}.yaml", file_name).as_str())?;
        ssh_client.execute(format!("sudo rm /tmp/{}.yaml", file_name).as_str())?;
        Ok(())
    }
}
