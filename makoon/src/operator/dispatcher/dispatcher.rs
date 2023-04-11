use std::sync::Arc;

use crate::operator::dispatcher::{create_cluster, delete_cluster};
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
            Event::CreateCluster { access, cluster_name, kube_version, os_image, os_image_storage } => {
                let _ = update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Creating);
                match create_cluster::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone(),
                    kube_version,
                    os_image,
                    os_image_storage) {
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
        }
    }
}

fn update_cluster_status(repo: &Repository, name: String, status: ClusterStatus) -> Result<(), String> {
    let mut cluster = repo.get_cluster(name)?.ok_or("Cannot find cluster")?;
    cluster.status = status;
    repo.save_cluster(cluster)?;
    Ok(())
}
