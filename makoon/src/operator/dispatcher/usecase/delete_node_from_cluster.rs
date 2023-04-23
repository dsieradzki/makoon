use std::sync::Arc;
use std::time::Duration;

use proxmox::{Client, ClientOperations};
use proxmox::model::AccessData;

use crate::operator::{Repository, ssh};
use crate::operator::dispatcher::usecase::common;
use crate::operator::model::{ClusterNodeType, LogEntry};

pub(crate) fn execute(
    proxmox_client: Arc<Client>,
    repo: Arc<Repository>,
    access: AccessData,
    cluster_name: String,
    node_name: String) -> Result<(), String> {
    let proxmox_client = proxmox_client.operations(access);
    repo.save_log(LogEntry::info(&cluster_name, format!("Start deleting node [{}-{}]", cluster_name, node_name)))?;

    let mut cluster = repo.get_cluster(cluster_name.clone())?.ok_or("Cannot find cluster")?;
    if cluster.nodes.len() == 1 {
        repo.save_log(LogEntry::error(&cluster_name, format!("Cannot delete last node, delete whole cluster instead")))?;
        return Ok(());
    }

    let master_node = cluster.nodes.iter()
        .find(|i| i.node_type == ClusterNodeType::Master && i.name != node_name)
        .map(|i| i.clone()).ok_or("Cannot find any master node".to_string())?;

    let node_to_delete = cluster.nodes.iter()
        .find(|i| i.name == node_name)
        .map(|i| i.clone()).ok_or("Cannot find node to delete".to_string())?;


    if common::vm::get_existing_vms(&proxmox_client, &cluster)?.iter()
        .find(|i| i.vm_id == node_to_delete.vm_id)
        .is_none() {
        remove_node_from_project(repo.clone(), &cluster_name, &node_name)?;
        remove_hosts_from_rest_of_nodes(repo.clone(), &proxmox_client, &cluster_name, &node_name)?;
        return Ok(());
    }

    let mut master_ssh_client = ssh::Client::new();
    master_ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;


    repo.save_log(LogEntry::info(&cluster_name, format!("Drain a node [{}-{}]", cluster_name, node_name)))?;
    master_ssh_client.execute(format!("sudo microk8s.kubectl drain {}-{} --ignore-daemonsets --grace-period=30 --timeout=60s", cluster_name, node_name).as_str())?;
    repo.save_log(LogEntry::info(&cluster_name, "Wait 30s to gracefully shutdown pods".to_string()))?;
    std::thread::sleep(Duration::from_secs(30));

    repo.save_log(LogEntry::info(&cluster_name, format!("Detach a node [{}-{}] from the cluster", cluster_name, node_name)))?;
    let mut node_to_delete_ssh_client = ssh::Client::new();
    node_to_delete_ssh_client.connect(&node_to_delete.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
    node_to_delete_ssh_client.execute("sudo microk8s leave")?;

    master_ssh_client.execute(format!("sudo microk8s remove-node {}-{}", cluster_name, node_name).as_str())?;


    cluster.nodes.retain_mut(|i| i.name == node_name);
    let vm_exists = common::vm::get_existing_vms(&proxmox_client, &cluster)?.iter().any(|i| i.vm_id == node_to_delete.vm_id);

    if vm_exists {
        repo.save_log(LogEntry::info(&cluster_name, format!("Removing VM [{}]", node_to_delete.vm_id)))?;

        proxmox_client.shutdown_vm(cluster.node.clone(), node_to_delete.vm_id).map_err(|e| format!("Shutdown VM [{}], error: [{}]", node_to_delete.vm_id, e))?;
        repo.save_log(LogEntry::info(&cluster.cluster_name, format!("Requested VM [{}] to shutdown", node_to_delete.vm_id)))?;
        let is_shutdown = common::vm::wait_for_shutdown(&proxmox_client, cluster.node.clone(), node_to_delete.vm_id)?;
        if !is_shutdown {
            proxmox_client.stop_vm(cluster.node.clone(), node_to_delete.vm_id)?;
            common::vm::wait_for_shutdown(&proxmox_client, cluster.node.clone(), node_to_delete.vm_id)?;
        }

        proxmox_client.delete_vm(cluster.node.clone(), node_to_delete.vm_id).map_err(|e| format!("Delete VM [{}], error: [{}]", node_to_delete.vm_id, e))?;
        repo.save_log(LogEntry::info(&cluster.cluster_name, format!("VM [{}] has been deleted", node_to_delete.vm_id)))?;
    }


    remove_node_from_project(repo.clone(), &cluster_name, &node_name)?;
    remove_hosts_from_rest_of_nodes(repo.clone(), &proxmox_client, &cluster_name, &node_name)?;

    Ok(())
}

fn remove_node_from_project(repo: Arc<Repository>, cluster_name: &str, node_name: &str) -> Result<(), String> {
    let mut cluster = repo.get_cluster(cluster_name.to_string())?.ok_or("Cannot find cluster")?;
    cluster.nodes.retain_mut(|i| i.name != node_name);
    repo.save_cluster(cluster)?;
    Ok(())
}

fn remove_hosts_from_rest_of_nodes(repo: Arc<Repository>, proxmox_client: &ClientOperations, cluster_name: &str, node_name: &str) -> Result<(), String> {
    let cluster = repo.get_cluster(cluster_name.to_string())?.ok_or("Cannot find cluster")?;
    let existing_nodes = common::vm::get_existing_vms(&proxmox_client, &cluster)?;
    for node in existing_nodes.iter() {
        let mut ssh_client = ssh::Client::new();
        ssh_client.connect(&node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
        ssh_client.execute(format!("sudo sed -i '/{}-{}/d' /etc/cloud/templates/hosts.debian.tmpl", cluster_name, node_name).as_str())?;
        ssh_client.execute(format!("sudo sed -i '/{}-{}/d' /etc/hosts", cluster_name, node_name).as_str())?;
    }
    Ok(())
}
