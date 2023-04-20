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

    pub fn dispatch(&self, event: Event) -> Result<(), String> {
        match event {
            Event::CreateCluster { access, cluster_name } => {
                let _ = update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Creating);
                match create_cluster::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone()) {
                    Ok(_) => {
                        update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Sync)?;
                        self.repo.save_log(ActionLogEntry::info(cluster_name, "Cluster has been created".to_string()))?;
                        info!("Cluster has been created");
                        Ok(())
                    }
                    Err(e) => {
                        update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Error)?;
                        self.repo.save_log(ActionLogEntry::error(cluster_name, e.clone()))?;
                        Err(e)
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
                        info!("Cluster has been deleted");
                        Ok(())
                    }
                    Err(e) => {
                        update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Error)?;
                        self.repo.save_log(ActionLogEntry::error(cluster_name, e.clone()))?;
                        Err(e)
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
                        self.repo.save_log(ActionLogEntry::info(cluster_name.clone(), format!("Node [{}] has been created", node_name)))?;

                        let mut cluster = self.repo.get_cluster(cluster_name.clone())?.ok_or(format!("Cannot find cluster [{}]", cluster_name))?;
                        cluster.nodes.iter_mut()
                            .find(|i| i.name == node_name)
                            .map(|i| i.lock = None)
                            .ok_or(format!("Cannot find node [{}]", node_name))?;

                        self.repo.save_cluster(cluster)?;
                        info!("Cluster node has been created");
                        Ok(())
                    }
                    Err(e) => {
                        update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Error)?;
                        self.repo.save_log(ActionLogEntry::error(cluster_name, e.clone()))?;
                        Err(e)
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
                        self.repo.save_log(ActionLogEntry::info(cluster_name.clone(), format!("Node [{}-{}] has been deleted", cluster_name, node_name)))?;
                        info!("Cluster node [{}-{}] has been deleted", cluster_name, node_name);
                        Ok(())
                    }
                    Err(e) => {
                        update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Error)?;
                        self.repo.save_log(ActionLogEntry::error(cluster_name, e.clone()))?;
                        Err(e)
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
