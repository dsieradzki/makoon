use std::collections::HashMap;
use std::sync::Arc;

use proxmox::Client;
use proxmox::model::AccessData;

use crate::operator::{Repository, ssh};
use crate::operator::dispatcher::create_cluster::*;
use crate::operator::model::{ActionLogEntry, Cluster, ClusterNode, ClusterNodeType};

pub(crate) fn execute(
    proxmox_client: Arc<Client>,
    repo: Arc<Repository>,
    access: AccessData,
    cluster_name: String,
    node_name: String) -> Result<(), String> {
    info!("Request to add node to the cluster has been received");
    let proxmox_client = proxmox_client.operations(access);

    repo.save_log(ActionLogEntry::info(cluster_name.clone(), "Start creating node".to_string()))?;


    let mut cluster = repo.get_cluster(cluster_name.clone())?.ok_or("Cannot find cluster")?;
    let master_node = cluster.nodes.iter()
        .find(|i| i.node_type == ClusterNodeType::Master)
        .map(|i| i.clone()).ok_or("Cannot find any master node".to_string())?;

    let exising_cluster_hosts = cluster.nodes.iter()
        .filter(|i| i.name != node_name)
        .map(|i| (format!("{}-{}", cluster.cluster_name, i.name), i.ip_address.clone()))
        .collect::<HashMap<String, String>>();

    let existing_nodes = cluster.nodes.iter().cloned()
        .filter(|i| i.name != node_name)
        .collect();

    cluster.nodes.retain_mut(|i| i.name == node_name);

    let path_to_image = download_os_image(
        cluster.os_image.clone().unwrap_or("https://cloud-images.ubuntu.com/kinetic/current/kinetic-server-cloudimg-amd64.img".to_owned()),
        cluster.os_image_storage.clone().unwrap_or("local".to_owned()),
        &proxmox_client, &cluster, repo.clone())?;

    create_vms(&proxmox_client, &cluster, repo.clone(), path_to_image)?;
    start_vms(&proxmox_client, &cluster, repo.clone())?;
    wait_for_vms_start(&proxmox_client, &cluster, repo.clone())?;
    restart_vms_if_necessary(&proxmox_client, &cluster, repo.clone())?;
    setup_new_vms(repo.clone(), &cluster, exising_cluster_hosts)?;
    add_new_node_host_to_existing_cluster(repo.clone(), &cluster, existing_nodes)?;
    install_kubernetes(repo.clone(), &cluster)?;
    wait_for_ready_kubernetes(repo.clone(), &cluster)?;
    join_nodes_to_cluster(repo.clone(), &cluster, master_node)?;

    Ok(())
}

fn add_new_node_host_to_existing_cluster(repo: Arc<Repository>, cluster: &Cluster, existing_nodes: Vec<ClusterNode>) -> Result<(), String> {
    let hosts = cluster.nodes.iter()
        .map(|i| (format!("{}-{}", cluster.cluster_name, i.name), i.ip_address.clone()))
        .collect::<HashMap<String, String>>();

    for node in existing_nodes.iter() {
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Add new node hostname to exising VM [{}]", node.vm_id)))?;
        let mut ssh_client = ssh::Client::new();
        ssh_client.connect(&node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
        for (host, ip) in hosts.iter() {
            ssh_client.execute(format!("echo '{} {}' | sudo tee -a /etc/cloud/templates/hosts.debian.tmpl", ip, host).as_str())?;
            ssh_client.execute(format!("echo '{} {}' | sudo tee -a /etc/hosts", ip, host).as_str())?;
        }
    }
    Ok(())
}

fn setup_new_vms(repo: Arc<Repository>, cluster: &Cluster, current_cluster_hosts: HashMap<String, String>) -> Result<(), String> {
    let mut hosts = cluster.nodes.iter()
        .map(|i| (format!("{}-{}", cluster.cluster_name, i.name), i.ip_address.clone()))
        .collect::<HashMap<String, String>>();

    hosts.extend(current_cluster_hosts);

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

fn join_nodes_to_cluster(repo: Arc<Repository>, cluster: &Cluster, master_node: ClusterNode) -> Result<(), String> {
    let nodes_to_join = &cluster.nodes;

    let mut master_ssh_client = ssh::Client::new();
    master_ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;

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
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Join node [{}-{}] with role [{}] to cluster", cluster.cluster_name, node_to_join.name, node_to_join.node_type)))?;
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
