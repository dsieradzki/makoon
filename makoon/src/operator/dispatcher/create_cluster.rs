use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;

use openssl::rsa::Rsa;
use pem::{encode, Pem};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};

use proxmox::{Client, ClientOperations, to_url_encoded};
use proxmox::model::{AccessData, CreateVirtualMachine, DownloadImage, DownloadImageContentType, OsType, ParamBuilder, ResizeDisk, ScsiHw, StorageContent};

use crate::helm;
use crate::operator::dispatcher::common;
use crate::operator::model::{ActionLogEntry, Cluster, ClusterNode, ClusterNodeType, ClusterResource, HelmApp, KeyPair};
use crate::operator::repository::Repository;
use crate::operator::ssh;

pub const HELM_CMD: &str = "microk8s.helm3";

pub(crate) fn execute(
    proxmox_client: Arc<Client>,
    repo: Arc<Repository>,
    access: AccessData,
    cluster_name: String) -> Result<(), String> {
    info!("Cluster creation request has been received");
    let proxmox_client = proxmox_client.operations(access);

    repo.save_log(ActionLogEntry::info(cluster_name.clone(), "Start creating cluster".to_string()))?;

    let mut cluster = repo.get_cluster(cluster_name.clone())?.ok_or("Cannot find cluster")?;
    let keys = generate_ssh_keys()?;
    cluster.ssh_key = keys;
    repo.save_cluster(cluster.clone())?;

    let path_to_image = download_os_image(
        cluster.os_image.clone().unwrap_or("https://cloud-images.ubuntu.com/kinetic/current/kinetic-server-cloudimg-amd64.img".to_owned()),
        cluster.os_image_storage.clone().unwrap_or("local".to_owned()),
        &proxmox_client, &cluster, repo.clone())?;
    create_vms(&proxmox_client, &cluster, repo.clone(), path_to_image)?;
    start_vms(&proxmox_client, &cluster, repo.clone())?;
    wait_for_vms_start(&proxmox_client, &cluster, repo.clone())?;
    restart_vms_if_necessary(&proxmox_client, &cluster, repo.clone())?;
    setup_vms(repo.clone(), &cluster)?;
    install_kubernetes(repo.clone(), &cluster)?;
    wait_for_ready_kubernetes(repo.clone(), &cluster)?;
    join_nodes_to_cluster(repo.clone(), &cluster)?;
    add_kubeconfig_to_project(repo.clone(), &mut cluster)?;
    enable_microk8s_addons(repo.clone(), &cluster)?;
    install_helm_apps(repo.clone(), &cluster)?;
    install_cluster_resources(repo.clone(), &cluster)?;
    Ok(())
}

fn install_cluster_resources(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), "Install Cluster resources".to_string()))?;

    let master_node = cluster.nodes.iter()
        .find(|i| i.node_type == ClusterNodeType::Master)
        .map(|i| i.clone()).ok_or("Cannot find any master node".to_string())?;

    let mut ssh_client = ssh::Client::new();
    ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;

    for resource in cluster.cluster_resources.iter() {
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Apply cluster resource: [{}]", resource.name)))?;
        install_cluster_resource(&ssh_client, resource)?;
    }
    Ok(())
}

pub fn install_cluster_resource(ssh_client: &ssh::Client, resource: &ClusterResource) -> Result<(), String> {
    let file_name = format!("{}_cluster_resource", resource.name.trim().replace(" ", "_"));
    ssh_client.upload_file(format!("/tmp/{}.yaml", file_name).as_str(), resource.content.as_str())?;
    ssh_client.execute(format!("sudo microk8s.kubectl apply -f /tmp/{}.yaml", file_name).as_str())?;
    ssh_client.execute(format!("sudo rm /tmp/{}.yaml", file_name).as_str())?;
    Ok(())
}

fn install_helm_apps(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), "Install Helm apps".to_string()))?;

    let master_node = cluster.nodes.iter()
        .find(|i| i.node_type == ClusterNodeType::Master)
        .map(|i| i.clone()).ok_or("Cannot find any master node".to_string())?;

    let mut ssh_client = ssh::Client::new();
    ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;

    for app in cluster.helm_apps.iter() {
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Install Helm app: [{}]", app.release_name)))?;
        install_helm_app(&ssh_client, app)?;
    }
    Ok(())
}

pub fn install_helm_app(ssh_client: &ssh::Client, app: &HelmApp) -> Result<(), String> {
    let values_file_name = app.release_name.trim().replace(" ", "_");


    ssh_client.execute(&helm::new(HELM_CMD)
        .sudo()
        .repo()
        .add(&app.chart_name, &app.repository)
        .build())?;

    ssh_client.execute(&helm::new(HELM_CMD)
        .sudo()
        .repo()
        .update()
        .build())?;

    if !app.values.is_empty() {
        ssh_client.upload_file(format!("/tmp/{}.yaml", values_file_name).as_str(), &app.values)?;
    }

    let mut command_builder = helm::new(HELM_CMD)
        .sudo()
        .upgrade_or_install()
        .create_namespace()
        .namespace(&app.namespace)
        .name(&app.release_name)
        .chart(&app.chart_name, &app.chart_name);


    if !app.values.is_empty() {
        command_builder = command_builder.with_values_file(&format!("/tmp/{}.yaml", values_file_name));
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

fn enable_microk8s_addons(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), "Enable MicroK8s addons: [dns, helm3]".to_string()))?;
    let master_node = cluster.nodes.iter()
        .find(|i| i.node_type == ClusterNodeType::Master)
        .map(|i| i.clone()).ok_or("Cannot find any master node".to_string())?;

    let mut ssh_client = ssh::Client::new();
    ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
    ssh_client.execute("sudo microk8s enable dns")?;
    ssh_client.execute("sudo microk8s enable helm3")?;
    Ok(())
}

fn add_kubeconfig_to_project(repo: Arc<Repository>, cluster: &mut Cluster) -> Result<(), String> {
    repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Add kube config to project")))?;
    let mut master_nodes = cluster.nodes.iter()
        .filter(|i| i.node_type == ClusterNodeType::Master)
        .map(|i| i.clone())
        .collect::<Vec<ClusterNode>>();
    master_nodes.sort_by(|a, b| a.vm_id.cmp(&b.vm_id));
    let first_master_node = master_nodes.first().ok_or("Cannot get first master node".to_string())?;
    let mut ssh_client = ssh::Client::new();
    ssh_client.connect(&first_master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
    let kube_config_content = ssh_client.execute("sudo microk8s config")?;
    cluster.cluster_config = kube_config_content.clone();
    let mut cluster_to_update = repo
        .get_cluster(cluster.cluster_name.clone())?
        .ok_or("Cannot read cluster from repository".to_string())?;
    cluster_to_update.cluster_config = kube_config_content;
    repo.save_cluster(cluster_to_update)?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
pub(crate) struct JoinNode {
    pub(crate) token: String,
    pub(crate) urls: Vec<String>,
}

fn join_nodes_to_cluster(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    if cluster.nodes.len() == 1 {
        return Ok(());
    }

    let master_node = cluster.nodes.iter()
        .find(|i| i.node_type == ClusterNodeType::Master)
        .map(|i| i.clone()).ok_or("Cannot find any master node".to_string())?;

    let nodes_to_join = cluster.nodes.clone().into_iter()
        .filter(|i| i.vm_id != master_node.vm_id)
        .collect::<Vec<ClusterNode>>();

    let mut master_ssh_client = ssh::Client::new();
    master_ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
    // master_ssh_client.execute(
    //     format!("sudo microk8s.kubectl label node {}-{} node-role.kubernetes.io/{}={}",
    //             cluster.cluster_name,
    //             master_node.name,
    //             master_node.node_type,
    //             master_node.node_type).as_str())?;

    for node_to_join in nodes_to_join.iter() {
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Generate join token on VM [{}] ", master_node.vm_id)))?;
        let token_content = master_ssh_client.execute("sudo microk8s add-node --format json")?;
        let join: JoinNode = serde_json::from_str(&token_content).map_err(|e| e.to_string())?;
        if join.urls.is_empty() {
            return Err("Join token doesn't have urls to join node".to_string());
        }
        let join = join.urls.first().ok_or("Cannot get url to join".to_string())?;
        let mut worker_ssh_client = ssh::Client::new();
        worker_ssh_client.connect(&node_to_join.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
        let command = format!("sudo microk8s join {}", join);
        let command = match node_to_join.node_type {
            ClusterNodeType::Master => command,
            ClusterNodeType::Worker => format!("{} --worker", command)
        };

        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Join node [{}] with role [{}] to cluster", node_to_join.vm_id, node_to_join.node_type)))?;
        worker_ssh_client.execute(command.as_str())?;
        // master_ssh_client.execute(
        //     format!("sudo microk8s.kubectl label node {}-{} node-role.kubernetes.io/{}={}",
        //             cluster.cluster_name,
        //             node_to_join.name,
        //             node_to_join.node_type,
        //             node_to_join.node_type).as_str())?;
    }
    Ok(())
}

pub(crate) fn install_kubernetes(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    for node in cluster.nodes.iter() {
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Install Kubernetes on VM [{}]", node.vm_id)))?;
        let mut ssh_client = ssh::Client::new();
        ssh_client.connect(&node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
        ssh_client.execute(format!("sudo snap install microk8s --channel={} --classic", cluster.kube_version.clone().unwrap_or("1.24/stable".to_owned())).as_str())?;
    }
    Ok(())
}

pub(crate) fn wait_for_ready_kubernetes(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    for node in cluster.nodes.iter() {
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Wait for Kubernetes on VM [{}]", node.vm_id)))?;
        let mut ssh_client = ssh::Client::new();
        ssh_client.connect(&node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
        ssh_client.execute("sudo microk8s status --wait-ready")?;
    }
    Ok(())
}

pub(crate) fn restart_vms_if_necessary(proxmox_client: &ClientOperations,
                                       cluster: &Cluster,
                                       repo: Arc<Repository>) -> Result<(), String> {
    for node in cluster.nodes.iter() {
        let mut ssh_client = ssh::Client::new();
        ssh_client.connect(&node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
        let is_restart_required = ssh_client.is_file_exists("/var/run/reboot-required")?;
        if !is_restart_required {
            continue;
        }

        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("VM [{}] has to be restarted", node.vm_id)))?;
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Shutdown VM [{}]", node.vm_id)))?;
        proxmox_client.shutdown_vm(cluster.node.clone(), node.vm_id)?;
        let is_shutdown = common::wait_for_shutdown(proxmox_client, cluster.node.clone(), node.vm_id)?;
        if !is_shutdown {
            info!("Shutdown VM [{}] is timeout, stop VM immediately", node.vm_id);
            proxmox_client.stop_vm(cluster.node.clone(), node.vm_id)?;
            let is_shutdown = common::wait_for_shutdown(proxmox_client, cluster.node.clone(), node.vm_id)?;
            if !is_shutdown {
                error!("Cannot shutdown VM [{}]", node.vm_id);
                return Err(format!("Cannot shutdown VM [{}]", node.vm_id));
            }
        }
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Starting VM [{}]", node.vm_id)))?;
        proxmox_client.start_vm(cluster.node.clone(), node.vm_id)?;
        common::wait_for_start(proxmox_client, cluster, node)?;
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("VM [{}] has been started", node.vm_id)))?;
    }

    Ok(())
}

pub(crate) fn wait_for_vms_start(proxmox_client: &ClientOperations, cluster: &Cluster, repo: Arc<Repository>) -> Result<(), String> {
    let all_vm_started = cluster.nodes.iter()
        .map(|i| -> bool{
            match common::wait_for_start(proxmox_client, cluster, i) {
                Ok(v) => {
                    let _ = repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("VM [{}] has been started", i.vm_id)));
                    Ok(v)
                }
                Err(e) => {
                    let _ = repo.save_log(ActionLogEntry::error(cluster.cluster_name.clone(), format!("Cannot start VM [{}]: {}", i.vm_id, e)));
                    Err(e)
                }
            }.is_ok()
        })
        .reduce(|acc, next| acc && next);
    if all_vm_started.unwrap_or(false) {
        Ok(())
    } else {
        Err("Cannot start VMs".to_string())
    }
}

fn setup_vms(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    let hosts = cluster.nodes.iter()
        .map(|i| (format!("{}-{}", cluster.cluster_name, i.name), i.ip_address.clone()))
        .collect::<HashMap<String, String>>();


    for node in cluster.nodes.iter() {
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Configure VM [{}]", node.vm_id)))?;
        let mut ssh_client = ssh::Client::new();
        ssh_client.connect(&node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
        ssh_client.execute("sudo systemctl enable iscsid")?;
        for (host, ip) in hosts.iter() {
            ssh_client.execute(format!("echo '{} {}' | sudo tee -a /etc/cloud/templates/hosts.debian.tmpl", ip, host).as_str())?;
            ssh_client.execute(format!("echo '{} {}' | sudo tee -a /etc/hosts", ip, host).as_str())?;
        }
    }
    Ok(())
}

fn generate_ssh_keys() -> Result<KeyPair, String> {
    let rsa = Rsa::generate(4096).map_err(|e| e.to_string())?;
    let private_key = rsa.private_key_to_der().map_err(|e| e.to_string())?;
    let private_key = Pem::new(
        String::from("RSA PRIVATE KEY"),
        private_key,
    );
    let private_key: String = encode(&private_key);

    let ssh_private_key = ssh_keys::openssh::parse_private_key(private_key.as_str()).map_err(|e| e.to_string())?;
    let ssh_private_key = ssh_private_key.get(0).ok_or("Cannot parse private key")?;
    let ssh_public_key = ssh_private_key.public_key();
    Ok(KeyPair {
        public_key: ssh_public_key.to_string(),
        private_key,
    })
}

pub(crate) fn download_os_image(
    os_image: String,
    os_image_storage: String,
    proxmox_client: &ClientOperations,
    cluster: &Cluster,
    repo: Arc<Repository>,
) -> Result<String, String> {
    let file_name = Path::new(os_image.as_str()).file_name();
    let file_name = match file_name {
        Some(v) => v.to_string_lossy().to_string(),
        None => return Err("Cannot extract file name for path".to_string())
    };

    let get_storage_content = || -> Result<Option<StorageContent>, String> {
        Ok(
            proxmox_client.storage_content(cluster.node.clone(), os_image_storage.clone())?
                .iter()
                .find(|i| i.volid.ends_with(file_name.as_str()))
                .map(|i| i.clone())
        )
    };
    let existing_image = get_storage_content();
    let existing_image = match existing_image {
        Ok(v) => v,
        Err(e) => {
            repo.save_log(ActionLogEntry::error(cluster.cluster_name.clone(), format!("Cannot check image availability [{}]", e.to_string())))?;
            return Err(e.to_string());
        }
    };
    if existing_image.is_none() {
        match proxmox_client.download_image(DownloadImage {
            content: DownloadImageContentType::Iso,
            filename: file_name.clone(),
            node: cluster.node.clone(),
            storage: os_image_storage.clone(),
            url: os_image,
            checksum: None,
            checksum_algorithm: None,
            verify_certificates: None,
        }) {
            Ok(_) => {
                repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Start downloading os image [{}]", file_name)))?;
            }
            Err(e) => {
                repo.save_log(ActionLogEntry::error(cluster.cluster_name.clone(), format!("Cannot download os image [{}]", e.to_string())))?;
                return Err(e.to_string());
            }
        }

        let downloaded = loop {
            let mut checks = 60;
            let is_image_downloaded = get_storage_content();

            let is_image_downloaded = match is_image_downloaded {
                Ok(v) => v,
                Err(e) => {
                    repo.save_log(ActionLogEntry::error(cluster.cluster_name.clone(), format!("Cannot image availability [{}]", e.to_string())))?;
                    return Err(e.to_string());
                }
            };

            if is_image_downloaded.is_some() {
                break Ok::<bool, String>(true);
            } else {
                info!("Os image not downloaded, wait 5 sec, remaining checks [{}]", checks);
                std::thread::sleep(Duration::from_secs(5));
                checks -= 1;
            }
            if checks <= 0 {
                break Ok(false);
            }
        };
        let downloaded = match downloaded {
            Ok(v) => v,
            Err(e) => {
                repo.save_log(ActionLogEntry::error(cluster.cluster_name.clone(), format!("Cannot download image [{}], download timeout [5] minutes", file_name)))?;
                return Err(e);
            }
        };

        if downloaded {
            repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Os image has been downloaded [{}]", file_name)))?;
        } else {
            //TODO: Figure out how to better handle waiting for an image, 5min is enough?
            repo.save_log(ActionLogEntry::error(cluster.cluster_name.clone(), format!("Cannot download image [{}], download timeout [5] minutes", file_name)))?;
            return Err("Cannot download os image".to_string());
        }
    }

    let storage_content = get_storage_content()?.ok_or("Cannot get storage content")?;
    let storage_content_details = proxmox_client.storage_content_details(cluster.node.clone(), os_image_storage.clone(), storage_content.volid)?;

    Ok(storage_content_details.path)
}

pub(crate) fn create_vms(proxmox_client: &ClientOperations,
                         cluster: &Cluster,
                         repo: Arc<Repository>,
                         os_image_path: String) -> Result<(), String> {
    let mut used_vm_ids: Vec<u32> = proxmox_client
        .virtual_machines(cluster.node.clone(), None)?.iter()
        .map(|i| i.vm_id)
        .collect();
    used_vm_ids.extend(proxmox_client.lxc_containers(cluster.node.clone())?.iter()
        .map(|i| &i.vm_id)
        .map(|i| i.parse::<u32>().unwrap_or_default())
        .collect::<Vec<u32>>());

    let vms_has_been_created = cluster.nodes.iter().map(|node| {
        if used_vm_ids.contains(&node.vm_id) {
            if let Err(e) = repo.save_log(
                ActionLogEntry::error(
                    cluster.cluster_name.clone(),
                    format!("VM with id [{}] already exists", node.vm_id),
                )) {
                error!("{}", e)
            }
            return false;
        }
        let result = proxmox_client.create_virtual_machine(CreateVirtualMachine {
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
                    .add_param("bridge", cluster.network.bridge.as_str())
                    .build()
            )]),
            scsihw: Some(ScsiHw::VirtioScsiPci),
            scsi: HashMap::from([(
                "scsi0".to_owned(),
                ParamBuilder::default()
                    .add_param_with_separator(node.storage_pool.as_str(), "0", ":")
                    .add_param("import-from", os_image_path.as_str())
                    .build()
            )]),
            ide: HashMap::from([(
                "ide2".to_owned(),
                ParamBuilder::default()
                    .add_param_with_separator(node.storage_pool.as_str(), "cloudinit", ":")
                    .build()
            )]),
            boot: Some(
                ParamBuilder::default()
                    .add_param("order", "scsi0")
                    .build()
            ),
            vga: Some("serial0".to_string()),
            serial: HashMap::from([(
                "serial0".to_owned(),
                "socket".to_owned()
            )]),
            ipconfig: HashMap::from([(
                "ipconfig0".to_owned(),
                ParamBuilder::default()
                    .add_param("ip", format!("{}/{}", node.ip_address, cluster.network.subnet_mask).as_str())
                    .add_param("gw", cluster.network.gateway.as_str())
                    .build()
            )]),
            nameserver: Some(cluster.network.dns.clone()),
            ci_user: Some(cluster.node_username.clone()),
            ci_password: Some(cluster.node_password.clone()),
            ssh_keys: Some(to_url_encoded(&cluster.ssh_key.public_key)),
            ..CreateVirtualMachine::default()
        });
        match result {
            Ok(_) => {
                if let Err(e) = repo.save_log(
                    ActionLogEntry::info(
                        cluster.cluster_name.clone(),
                        format!("VM [{}] has been created", node.vm_id)),
                ) {
                    error!("{}", e)
                }
            }
            Err(e) => {
                if let Err(e) = repo.save_log(
                    ActionLogEntry::error(
                        cluster.cluster_name.clone(),
                        format!("VM [{}] cannot be created: [{}]", node.vm_id, e),
                    )) {
                    error!("{}", e)
                }
                return false;
            }
        }

        let mut checks = 10;
        loop {
            let vms = proxmox_client.virtual_machines(cluster.node.clone(), Some(true)).unwrap();
            let vm = vms.iter().find(|i| i.vm_id == node.vm_id).ok_or("Cannot find current vm to check lock").unwrap();
            if vm.lock.is_some() {
                checks -= 1;
                info!("Wait for lock release for VM [{}], remaining checks [{}]", node.vm_id, checks);
                std::thread::sleep(Duration::from_secs(10))
            } else {
                break;
            }
            if checks <= 0 {
                break;
            }
        }

        match proxmox_client.resize_disk(ResizeDisk {
            vm_id: node.vm_id,
            node: cluster.node.clone(),
            disk: "scsi0".to_string(),
            size: format!("{}G", cluster.disk_size),
        }) {
            Ok(_) => {
                if let Err(e) = repo.save_log(
                    ActionLogEntry::info(
                        cluster.cluster_name.clone(),
                        format!("Disk size for VM [{}] has been changed to [{} GB]", node.vm_id, cluster.disk_size),
                    )) {
                    error!("{}", e);
                }
                return true;
            }
            Err(e) => {
                if let Err(e) = repo.save_log(
                    ActionLogEntry::error(
                        cluster.cluster_name.clone(),
                        format!("Disk size for VM [{}] cannot be changed to [{} GB]", node.vm_id, e),
                    )) {
                    error!("{}", e)
                }
                return false;
            }
        }
    })
        .reduce(|acc, next| acc && next)
        .unwrap_or(false);

    if !vms_has_been_created {
        return Err("Cannot create cluster".to_string());
    }

    Ok(())
}

pub(crate) fn start_vms(proxmox_client: &ClientOperations,
                        cluster: &Cluster,
                        repo: Arc<Repository>) -> Result<(), String> {
    for node in cluster.nodes.iter() {
        match proxmox_client.start_vm(cluster.node.clone(), node.vm_id) {
            Ok(_) => {
                repo.save_log(
                    ActionLogEntry::info(
                        cluster.cluster_name.clone(),
                        format!("Starting VM [{}]", node.vm_id),
                    ))?;
            }
            Err(e) => {
                repo.save_log(
                    ActionLogEntry::error(
                        cluster.cluster_name.clone(),
                        format!("Cannot start VM [{}]: [{}]", node.vm_id, e),
                    ))?;
            }
        }
    }
    Ok(())
}
