use std::sync::Arc;

use proxmox::ClientOperations;
use proxmox::model::AccessData;
use crate::operator::dispatcher::usecase::common;

use crate::operator::model::{LogEntry, Cluster, ClusterNode};
use crate::operator::repository::Repository;

pub(crate) fn execute(
    proxmox_client: Arc<proxmox::Client>,
    repo: Arc<Repository>,
    access: AccessData,
    cluster_name: String) -> Result<(), String> {
    let proxmox_client = proxmox_client.operations(access);
    let cluster = repo.get_cluster(&cluster_name)?.ok_or("Cannot find cluster")?;

    let existing_nodes = common::vm::get_existing_vms(&proxmox_client, &cluster)?;
    stop_vms(&repo, &proxmox_client, &cluster, &existing_nodes)?;
    delete_vms(repo.clone(), &proxmox_client, &cluster, &existing_nodes)?;

    repo.delete_cluster(cluster_name)?;
    Ok(())
}


pub(crate) fn stop_vms(repo: &Arc<Repository>, proxmox_client: &ClientOperations, cluster: &Cluster, existing_nodes: &[ClusterNode]) -> Result<(), String> {
    for node in existing_nodes.iter() {
        proxmox_client.shutdown_vm(&cluster.node, node.vm_id).map_err(|e| format!("Shutdown VM [{}], error: [{}]", node.vm_id, e))?;
        repo.save_log(LogEntry::info(&cluster.cluster_name, format!("Requested VM [{}] to shutdown", node.vm_id)))?;
    }

    for node in existing_nodes.iter() {
        repo.save_log(LogEntry::info(&cluster.cluster_name, format!("Wait for VM [{}] shutdown", node.vm_id)))?;
        let is_shutdown = common::vm::wait_for_shutdown(proxmox_client, &cluster.node, node.vm_id)?;
        if !is_shutdown {
            repo.save_log(LogEntry::info(&cluster.cluster_name, format!("VM [{}] cannot be shouted down gracefully, stop VM imminently", node.vm_id)))?;
            proxmox_client.stop_vm(&cluster.node, node.vm_id)?;
            common::vm::wait_for_shutdown(proxmox_client, &cluster.node, node.vm_id)?;
        }
    }
    Ok(())
}

pub(crate) fn delete_vms(repo: Arc<Repository>, proxmox_client: &ClientOperations, cluster: &Cluster, existing_nodes: &[ClusterNode]) -> Result<(), String> {
    for node in existing_nodes.iter() {
        proxmox_client.delete_vm(&cluster.node, node.vm_id).map_err(|e| format!("Delete VM [{}], error: [{}]", node.vm_id, e))?;
        repo.save_log(LogEntry::info(&cluster.cluster_name, format!("VM [{}] has been deleted", node.vm_id)))?;
    }
    Ok(())
}