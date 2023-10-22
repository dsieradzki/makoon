use std::collections::HashMap;
use std::sync::Arc;
use log::info;

use openssl::rsa::Rsa;
use pem::{encode, Pem};

use proxmox_client::model::AccessData;
use proxmox_client::{Client, ClientOperations};
use crate::dispatcher::usecase::common;
use crate::model::{Cluster, ClusterNode, ClusterNodeType, KeyPair, LogEntry};
use crate::Repository;


pub(crate) fn execute(
    proxmox_client: Arc<Client>,
    repo: Arc<Repository>,
    access: AccessData,
    cluster_name: String,
) -> Result<(), String> {
    info!("Cluster creation request has been received");
    let proxmox_client = proxmox_client.operations(access);

    repo.save_log(LogEntry::info(
        &cluster_name,
        "Start creating cluster".to_string(),
    ))?;

    let mut cluster = repo
        .get_cluster(&cluster_name)?
        .ok_or("Cannot find cluster")?;
    let keys = generate_ssh_keys()?;
    cluster.ssh_key = keys;
    repo.save_cluster(cluster.clone())?;

    create_vms(&proxmox_client, &cluster, repo.clone())?;
    start_vms(&proxmox_client, &cluster, repo.clone())?;
    wait_for_vms_start(&proxmox_client, &cluster, repo.clone())?;
    restart_vms_if_necessary(&proxmox_client, &cluster, repo.clone())?;
    setup_vms(repo.clone(), &cluster)?;
    install_kubernetes(repo.clone(), &cluster)?;
    wait_for_ready_kubernetes(repo.clone(), &cluster)?;
    join_nodes_to_cluster(repo.clone(), &cluster)?;
    add_kubeconfig_to_project(repo.clone(), &mut cluster)?;
    enable_microk8s_addons(repo.clone(), &cluster)?;
    deploy_helm_apps(repo.clone(), &cluster)?;
    deploy_workloads(repo.clone(), &cluster)?;
    Ok(())
}

fn deploy_workloads(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    repo.save_log(LogEntry::info(
        &cluster.cluster_name,
        "Install Workloads".to_string(),
    ))?;

    let master_node = cluster
        .nodes
        .iter()
        .find(|i| i.node_type == ClusterNodeType::Master)
        .map(|i| i.clone())
        .ok_or("Cannot find any master node".to_string())?;

    let mut ssh_client = ssh_client::Client::new();
    ssh_client.connect(
        &master_node.ip_address,
        &cluster.node_username,
        &cluster.ssh_key.private_key,
        &cluster.ssh_key.public_key,
    )?;

    for resource in cluster.cluster_resources.iter() {
        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("Install workload: [{}]", resource.name),
        ))?;
        common::apps::install_workload(&ssh_client, resource)?;
    }
    Ok(())
}

fn deploy_helm_apps(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    repo.save_log(LogEntry::info(
        &cluster.cluster_name,
        "Install Helm apps".to_string(),
    ))?;

    let master_node = cluster
        .nodes
        .iter()
        .find(|i| i.node_type == ClusterNodeType::Master)
        .cloned()
        .ok_or("Cannot find any master node".to_string())?;

    let mut ssh_client = ssh_client::Client::new();
    ssh_client.connect(
        &master_node.ip_address,
        &cluster.node_username,
        &cluster.ssh_key.private_key,
        &cluster.ssh_key.public_key,
    )?;

    for app in cluster.helm_apps.iter() {
        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("Install Helm app: [{}]", app.release_name),
        ))?;
        common::apps::install_helm_app(&ssh_client, app)?;
    }
    Ok(())
}

fn enable_microk8s_addons(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    repo.save_log(LogEntry::info(
        &cluster.cluster_name,
        "Enable MicroK8s addons: [dns, helm3]".to_string(),
    ))?;
    let master_node = cluster
        .nodes
        .iter()
        .find(|i| i.node_type == ClusterNodeType::Master)
        .cloned()
        .ok_or("Cannot find any master node".to_string())?;

    let mut ssh_client = ssh_client::Client::new();
    ssh_client.connect(
        &master_node.ip_address,
        &cluster.node_username,
        &cluster.ssh_key.private_key,
        &cluster.ssh_key.public_key,
    )?;
    ssh_client.execute("sudo microk8s enable dns")?;
    ssh_client.execute("sudo microk8s enable helm3")?;
    Ok(())
}

fn add_kubeconfig_to_project(repo: Arc<Repository>, cluster: &mut Cluster) -> Result<(), String> {
    repo.save_log(LogEntry::info(
        &cluster.cluster_name,
        format!("Add kube config to project"),
    ))?;
    let mut master_nodes = cluster
        .nodes
        .iter()
        .filter(|i| i.node_type == ClusterNodeType::Master)
        .cloned()
        .collect::<Vec<ClusterNode>>();
    master_nodes.sort_by(|a, b| a.vm_id.cmp(&b.vm_id));
    let first_master_node = master_nodes
        .first()
        .ok_or("Cannot get first master node".to_string())?;
    let mut ssh_client = ssh_client::Client::new();
    ssh_client.connect(
        &first_master_node.ip_address,
        &cluster.node_username,
        &cluster.ssh_key.private_key,
        &cluster.ssh_key.public_key,
    )?;
    let kube_config_content = ssh_client.execute("sudo microk8s config")?;
    cluster.cluster_config = kube_config_content.clone();
    let mut cluster_to_update = repo
        .get_cluster(&cluster.cluster_name)?
        .ok_or("Cannot read cluster from repository".to_string())?;
    cluster_to_update.cluster_config = kube_config_content;
    repo.save_cluster(cluster_to_update)?;
    Ok(())
}

fn join_nodes_to_cluster(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    if cluster.nodes.len() == 1 {
        return Ok(());
    }

    let master_node = cluster
        .nodes
        .iter()
        .find(|i| i.node_type == ClusterNodeType::Master)
        .cloned()
        .ok_or("Cannot find any master node".to_string())?;

    let nodes_to_join = cluster
        .nodes
        .clone()
        .into_iter()
        .filter(|i| i.vm_id != master_node.vm_id)
        .collect::<Vec<ClusterNode>>();

    for node_to_join in nodes_to_join.iter() {
        common::cluster::join_node_to_cluster(repo.clone(), cluster, &master_node, node_to_join)?;
    }
    Ok(())
}

pub(crate) fn install_kubernetes(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    info!("Install Kubernetes");
    for node in cluster.nodes.iter() {
        common::cluster::install_kubernetes(repo.clone(), cluster, node)?;
    }
    Ok(())
}

pub(crate) fn wait_for_ready_kubernetes(
    repo: Arc<Repository>,
    cluster: &Cluster,
) -> Result<(), String> {
    for node in cluster.nodes.iter() {
        common::cluster::wait_for_ready_kubernetes(repo.clone(), cluster, node)?;
    }
    Ok(())
}

pub(crate) fn restart_vms_if_necessary(
    proxmox_client: &ClientOperations,
    cluster: &Cluster,
    repo: Arc<Repository>,
) -> Result<(), String> {
    info!("Restart VM's if necessary");
    for node in cluster.nodes.iter() {
        common::vm::restart_vm_if_necessary(proxmox_client, repo.clone(), cluster, node)?;
    }
    Ok(())
}

pub(crate) fn wait_for_vms_start(
    proxmox_client: &ClientOperations,
    cluster: &Cluster,
    repo: Arc<Repository>,
) -> Result<(), String> {
    info!("Waiting for VM's start");
    for node in cluster.nodes.iter() {
        common::vm::wait_for_start(proxmox_client, cluster, node)
            .map_err(|e| format!("Cannot start VM [{}]: {}", node.vm_id, e))?;
        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("VM [{}] has been started", node.vm_id),
        ))?;
    }
    Ok(())
}

fn setup_vms(repo: Arc<Repository>, cluster: &Cluster) -> Result<(), String> {
    info!("Setup VM's");
    let hosts = cluster
        .nodes
        .iter()
        .map(|i| {
            (
                format!("{}-{}", cluster.cluster_name, i.name),
                i.ip_address.clone(),
            )
        })
        .collect::<HashMap<String, String>>();

    for node in cluster.nodes.iter() {
        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("Configure VM [{}]", node.vm_id),
        ))?;
        common::vm::setup_vm(cluster, node, &hosts)?;
    }
    Ok(())
}

fn generate_ssh_keys() -> Result<KeyPair, String> {
    info!("Generate SSH keys");
    let rsa = Rsa::generate(4096).map_err(|e| e.to_string())?;
    let private_key = rsa.private_key_to_der().map_err(|e| e.to_string())?;
    let private_key = Pem::new(String::from("RSA PRIVATE KEY"), private_key);
    let private_key: String = encode(&private_key);

    let ssh_private_key =
        ssh_keys::openssh::parse_private_key(private_key.as_str()).map_err(|e| e.to_string())?;
    let ssh_private_key = ssh_private_key.get(0).ok_or("Cannot parse private key")?;
    let ssh_public_key = ssh_private_key.public_key();
    info!("SSH keys has been generated");
    Ok(KeyPair {
        public_key: ssh_public_key.to_string(),
        private_key,
    })
}

pub(crate) fn create_vms(
    proxmox_client: &ClientOperations,
    cluster: &Cluster,
    repo: Arc<Repository>,
) -> Result<(), String> {
    info!("Create VM's");
    let mut used_vm_ids: Vec<u32> = proxmox_client
        .virtual_machines(&cluster.node, None)?
        .iter()
        .map(|i| i.vm_id)
        .collect();

    used_vm_ids.extend(
        proxmox_client
            .lxc_containers(&cluster.node)?
            .iter()
            .map(|i| &i.vm_id)
            .map(|i| i.parse::<u32>().unwrap_or_default())
            .collect::<Vec<u32>>(),
    );

    for node in cluster.nodes.iter() {
        if used_vm_ids.contains(&node.vm_id) {
            return Err(format!("VM with id [{}] already exists", node.vm_id));
        }
        common::vm::create(proxmox_client, repo.clone(), cluster, node)
            .map_err(|e| format!("Cannot create VM [{}]: {}", node.vm_id, e))?;
        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("VM [{}] has been created", node.vm_id),
        ))?;
    }
    info!("VM's has been created");
    Ok(())
}

pub(crate) fn start_vms(
    proxmox_client: &ClientOperations,
    cluster: &Cluster,
    repo: Arc<Repository>,
) -> Result<(), String> {
    info!("Start VM's");
    for node in cluster.nodes.iter() {
        proxmox_client
            .start_vm(&cluster.node, node.vm_id)
            .map_err(|e| format!("Cannot start VM [{}]: {}", node.vm_id, e))?;
        repo.save_log(LogEntry::info(
            &cluster.cluster_name,
            format!("Starting VM [{}]", node.vm_id),
        ))?;
    }
    Ok(())
}
