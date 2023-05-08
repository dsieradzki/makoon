use std::collections::HashMap;
use std::sync::Arc;

use proxmox::Client;
use proxmox::model::AccessData;

use crate::operator::Repository;
use crate::operator::dispatcher::usecase::common;
use crate::operator::model::{Cluster, ClusterNode, ClusterNodeType, LogEntry};

pub(crate) fn execute(
    proxmox_client: Arc<Client>,
    repo: Arc<Repository>,
    access: AccessData,
    cluster_name: String,
    node_name: String) -> Result<(), String> {
    info!("Request to add node to the cluster has been received");
    let proxmox_client = proxmox_client.operations(access);

    repo.save_log(LogEntry::info(&cluster_name, "Start creating node".to_string()))?;


    let cluster = repo.get_cluster(&cluster_name)?.ok_or("Cannot find cluster")?;
    let master_node = cluster.nodes.iter()
        .find(|i| i.node_type == ClusterNodeType::Master && i.name != node_name).cloned().ok_or("Cannot find any master node".to_string())?;

    let exising_cluster_hosts = cluster.nodes.iter()
        .filter(|i| i.name != node_name)
        .map(|i| (format!("{}-{}", cluster.cluster_name, i.name), i.ip_address.clone()))
        .collect::<HashMap<String, String>>();

    let existing_nodes = common::vm::get_existing_vms(&proxmox_client, &cluster)?.into_iter()
        .filter(|i| i.name != node_name)
        .collect();

    let node_to_add = cluster.nodes.iter().find(|i| i.name == node_name).ok_or("Cannot find node to create")?;


    common::vm::create(&proxmox_client, repo.clone(), &cluster, node_to_add)?;

    proxmox_client.start_vm(&cluster.node, node_to_add.vm_id).map_err(|e| format!("Cannot start VM [{}]: {}", node_to_add.vm_id, e))?;
    repo.save_log(LogEntry::info(&cluster.cluster_name, format!("Starting VM [{}]", node_to_add.vm_id)))?;


    common::vm::wait_for_start(&proxmox_client, &cluster, &node_to_add).map_err(|e| format!("Cannot start VM [{}]: {}", node_to_add.vm_id, e))?;
    repo.save_log(LogEntry::info(&cluster.cluster_name, format!("VM [{}] has been started", node_to_add.vm_id)))?;


    common::vm::restart_vm_if_necessary(&proxmox_client, repo.clone(), &cluster, node_to_add)?;

    setup_vm(repo.clone(), &cluster, node_to_add, exising_cluster_hosts)?;

    add_new_node_host_to_existing_cluster(repo.clone(), &cluster, existing_nodes)?;

    common::cluster::install_kubernetes(repo.clone(), &cluster, node_to_add)?;

    common::cluster::wait_for_ready_kubernetes(repo.clone(), &cluster, node_to_add)?;

    common::cluster::join_node_to_cluster(repo.clone(), &cluster, &master_node, node_to_add)?;

    Ok(())
}

fn add_new_node_host_to_existing_cluster(repo: Arc<Repository>, cluster: &Cluster, existing_nodes: Vec<ClusterNode>) -> Result<(), String> {
    let hosts = cluster.nodes.iter()
        .map(|i| (format!("{}-{}", cluster.cluster_name, i.name), i.ip_address.clone()))
        .collect::<HashMap<String, String>>();

    for node in existing_nodes.iter() {
        repo.save_log(LogEntry::info(&cluster.cluster_name, format!("Add new node hostname to exising VM [{}]", node.vm_id)))?;
        common::vm::setup_vm(cluster, node, &hosts)?;
    }
    Ok(())
}

fn setup_vm(repo: Arc<Repository>, cluster: &Cluster, node: &ClusterNode, current_cluster_hosts: HashMap<String, String>) -> Result<(), String> {
    let mut hosts = cluster.nodes.iter()
        .map(|i| (format!("{}-{}", cluster.cluster_name, i.name), i.ip_address.clone()))
        .collect::<HashMap<String, String>>();

    hosts.extend(current_cluster_hosts);

    repo.save_log(LogEntry::info(&cluster.cluster_name, format!("Configure VM [{}]", node.vm_id)))?;
    common::vm::setup_vm(cluster, node, &hosts)?;
    Ok(())
}
