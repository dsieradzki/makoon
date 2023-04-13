use std::sync::Arc;
use proxmox::Client;
use proxmox::model::AccessData;
use crate::operator::Repository;

pub(crate) fn execute(
    proxmox_client: Arc<Client>,
    repo: Arc<Repository>,
    access: AccessData,
    cluster_name: String,
    node_name: String) -> Result<(), String> {
    Ok(())
}