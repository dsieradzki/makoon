use proxmox::model::VmStatus;

use crate::operator::dispatcher::utils::retry;
use crate::operator::model::{Cluster, ClusterNode};

pub fn wait_for_shutdown(proxmox_client: &proxmox::ClientOperations, node: String, vm_id: u32) -> Result<bool, String> {
    let is_shutdown = retry(|| {
        let status = proxmox_client
            .status_vm(node.clone(), vm_id)
            .map(|i| i.status)
            .map_err(|e| format!("Status VM {}, error: {}", vm_id, e))?;

        match status {
            VmStatus::Running => {
                info!("VM [{}] is running, wait 10 sec for gracefully shutdown", vm_id);
                Err("Running".to_string())
            }
            VmStatus::Stopped => Ok(())
        }
    });

    match is_shutdown {
        Ok(_) => Ok(true),
        Err(e) => {
            match e.as_str() {
                "Running" => Ok(false),
                _ => Err(e)
            }
        }
    }
}

pub fn wait_for_start(proxmox_client: &proxmox::ClientOperations,
                      cluster: &Cluster,
                      cluster_node: &ClusterNode) -> Result<(), String> {
    retry(|| {
        let status = proxmox_client
            .status_vm(cluster.node.clone(), cluster_node.vm_id)
            .map(|i| i.status)
            .map_err(|e| format!("Status VM {}, error: {}", cluster_node.vm_id, e))?;

        match status {
            VmStatus::Running => {
                Ok(())
            }
            VmStatus::Stopped => {
                Err("Stopped".to_string())
            }
        }
    })?;

    retry(|| {
        let mut ssh_client = crate::operator::ssh::Client::new();
        ssh_client.connect(&cluster_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;
        ssh_client.execute("cloud-init status --wait")
    })?;
    Ok(())
}
