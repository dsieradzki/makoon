use std::sync::Arc;
use log::info;

use proxmox_client::{
    model::{AccessData, VmConfig},
    Client,
};
use crate::dispatcher::usecase::common;
use crate::model::LogEntry;
use crate::Repository;


pub(crate) fn execute(
    proxmox_client: Arc<Client>,
    repo: Arc<Repository>,
    access: AccessData,
    cluster_name: String,
    node_name: String,
    cores: u16,
    memory: u32,
) -> Result<(), String> {
    info!("Cluster creation request has been received");
    let proxmox_client = proxmox_client.operations(access);

    repo.save_log(LogEntry::info(
        &cluster_name,
        "Start creating cluster".to_string(),
    ))?;

    let cluster = repo
        .get_cluster(&cluster_name)?
        .ok_or("Cannot find cluster")?;

    let node_to_change = cluster
        .nodes
        .iter()
        .find(|i| i.name == node_name)
        .ok_or("Cannot find node to create")?;
    proxmox_client.update_config(VmConfig {
        vm_id: node_to_change.vm_id,
        node: cluster.node.clone(),
        cores,
        memory: u64::from(memory),
    })?;

    common::vm::stop_vm(&proxmox_client, &cluster.node, node_to_change.vm_id)?;
    proxmox_client.start_vm(&cluster.node, node_to_change.vm_id)?;

    let mut cluster = repo
        .get_cluster(&cluster_name)?
        .ok_or("Cannot find cluster")?;
    for node in cluster.nodes.iter_mut() {
        if node.name == node_name {
            node.cores = cores;
            node.memory = memory;
        }
    }
    repo.save_cluster(cluster)?;

    Ok(())
}
