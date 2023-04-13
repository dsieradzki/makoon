use std::sync::Arc;

use crate::operator::dispatcher::{add_node_to_cluster, create_cluster, delete_cluster, delete_node_from_cluster};
use crate::operator::event::Event;
use crate::operator::model::{ActionLogEntry, ClusterStatus};
use crate::operator::repository::Repository;

pub struct Dispatcher {
    proxmox_client: Arc<proxmox::Client>,
    repo: Arc<Repository>,
}

impl Dispatcher {
    pub fn new(proxmox_client: Arc<proxmox::Client>, repo: Arc<Repository>) -> Self {
        Dispatcher {
            proxmox_client,
            repo,
        }
    }

    pub fn dispatch(&self, event: Event) {
        match event {
            Event::CreateCluster { access, cluster_name } => {
                let _ = update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Creating);
                match create_cluster::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone()) {
                    Ok(_) => {
                        let _ = update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Sync);
                        info!("Cluster has been created")
                    }
                    Err(e) => {
                        let _ = update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Error);
                        let _ = self.repo.save_log(ActionLogEntry::error(cluster_name.clone(), e.clone()));
                        error!("{}", e)
                    }
                }
            }
            Event::DeleteCluster { access, cluster_name } => {
                match delete_cluster::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone()) {
                    Ok(_) => {
                        info!("Cluster has been deleted")
                    }
                    Err(e) => {
                        let _ = update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Error);
                        let _ = self.repo.save_log(ActionLogEntry::error(cluster_name.clone(), e.clone()));
                        error!("{}", e);
                    }
                }
            }
            Event::AddNodeToCluster { access, cluster_name, node_name } => {
                match add_node_to_cluster::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone(),
                    node_name.clone()) {
                    Ok(_) => {
                        info!("Cluster node has been created")
                    }
                    Err(e) => {
                        let _ = update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Error);
                        let _ = self.repo.save_log(ActionLogEntry::error(cluster_name.clone(), e.clone()));
                        error!("{}", e);
                    }
                }
            }
            Event::DeleteNodeFromCluster { access, cluster_name, node_name } => {
                match delete_node_from_cluster::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone(),
                    node_name.clone()) {
                    Ok(_) => {
                        info!("Cluster node has been deleted")
                    }
                    Err(e) => {
                        let _ = update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Error);
                        let _ = self.repo.save_log(ActionLogEntry::error(cluster_name.clone(), e.clone()));
                        error!("{}", e);
                    }
                }
            }
        }
    }
}

fn update_cluster_status(repo: &Repository, name: String, status: ClusterStatus) -> Result<(), String> {
    let mut cluster = repo.get_cluster(name)?.ok_or("Cannot find cluster")?;
    cluster.status = status;
    repo.save_cluster(cluster)?;
    Ok(())
}
