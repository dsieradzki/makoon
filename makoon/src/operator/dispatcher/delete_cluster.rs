use std::sync::{Arc, RwLock};

use proxmox::ClientOperations;
use proxmox::model::AccessData;

use crate::operator::dispatcher::common;
use crate::operator::model::{ActionLogEntry, Cluster, ClusterNode};
use crate::operator::Operator;
use crate::operator::repository::Repository;

pub(crate) fn execute(
    proxmox_client: Arc<proxmox::Client>,
    repo: Arc<Repository>,
    access: AccessData,
    cluster_name: String) -> Result<(), String> {
    let proxmox_client = proxmox_client.operations(access);
    let cluster = repo.get_cluster(cluster_name.clone())?.ok_or("Cannot find cluster")?;

    let existing_nodes = get_existing_vms(&proxmox_client, &cluster)?;
    stop_vms(&repo, &proxmox_client, &cluster, &existing_nodes)?;
    delete_vms(repo.clone(), &proxmox_client, &cluster, &existing_nodes)?;

    repo.delete_cluster(cluster_name)?;
    Ok(())
}

fn delete_vms(repo: Arc<Repository>, proxmox_client: &ClientOperations, cluster: &Cluster, existing_nodes: &Vec<ClusterNode>) -> Result<(), String> {
    for node in existing_nodes.iter() {
        proxmox_client.delete_vm(cluster.node.clone(), node.vm_id).map_err(|e| format!("Delete VM {}, error: {}", node.vm_id, e))?;
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Node deleted: {}", node.vm_id)))?;
    }
    Ok(())
}

fn stop_vms(repo: &Arc<Repository>, proxmox_client: &ClientOperations, cluster: &Cluster, existing_nodes: &Vec<ClusterNode>) -> Result<(), String> {
    for node in existing_nodes.iter() {
        proxmox_client.shutdown_vm(cluster.node.clone(), node.vm_id).map_err(|e| format!("Shutdown VM {}, error: {}", node.vm_id, e))?;
        repo.save_log(ActionLogEntry::info(cluster.cluster_name.clone(), format!("Requested node shutdown: {}", node.vm_id)))?;
    }

    for node in existing_nodes.iter() {
        let is_shutdown = common::wait_for_shutdown(&proxmox_client, cluster.node.clone(), node.vm_id)?;
        if !is_shutdown {
            proxmox_client.stop_vm(cluster.node.clone(), node.vm_id)?;
            common::wait_for_shutdown(&proxmox_client, cluster.node.clone(), node.vm_id)?;
        }
    }
    Ok(())
}

fn get_existing_vms(proxmox_client: &ClientOperations, cluster: &Cluster) -> Result<Vec<ClusterNode>, String> {
    let vms = proxmox_client
        .virtual_machines(cluster.node.clone(), None)?
        .into_iter()
        .map(|i| (i.vm_id.clone(), i.name.unwrap_or_default()))
        .collect::<Vec<(u32, String)>>();

    let existing_nodes = cluster.nodes.clone().into_iter()
        .filter(|e| {
            let name = format!("{}-{}", cluster.cluster_name, e.name);
            vms.contains(&(e.vm_id.clone(), name))
        })
        .collect::<Vec<ClusterNode>>();
    Ok(existing_nodes)
}