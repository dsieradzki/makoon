use std::sync::Arc;
use log::info;
use crate::dispatcher::usecase;
use crate::event::Event;
use crate::model::{ClusterStatus, LogEntry};
use crate::Repository;


use super::usecase::change_resources;

pub struct Dispatcher {
    proxmox_client: Arc<proxmox_client::Client>,
    repo: Arc<Repository>,
}

impl Dispatcher {
    pub fn new(proxmox_client: Arc<proxmox_client::Client>, repo: Arc<Repository>) -> Self {
        Dispatcher {
            proxmox_client,
            repo,
        }
    }

    pub fn dispatch(&self, event: Event) -> Result<(), String> {
        match event {
            Event::CreateCluster {
                access,
                cluster_name,
            } => {
                update_cluster_status(&self.repo, cluster_name.clone(), ClusterStatus::Creating)?;
                match usecase::create_cluster::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone(),
                ) {
                    Ok(_) => {
                        update_cluster_status(
                            &self.repo,
                            cluster_name.clone(),
                            ClusterStatus::Sync,
                        )?;
                        self.repo.save_log(LogEntry::info(
                            &cluster_name,
                            "Cluster has been created".to_string(),
                        ))?;
                        info!("Cluster has been created");
                        Ok(())
                    }
                    Err(e) => {
                        update_cluster_status(
                            &self.repo,
                            cluster_name.clone(),
                            ClusterStatus::Error,
                        )?;
                        self.repo
                            .save_log(LogEntry::error(&cluster_name, e.clone()))?;
                        Err(e)
                    }
                }
            }
            Event::DeleteCluster {
                access,
                cluster_name,
            } => {
                match usecase::delete_cluster::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone(),
                ) {
                    Ok(_) => {
                        info!("Cluster has been deleted");
                        Ok(())
                    }
                    Err(e) => {
                        update_cluster_status(
                            &self.repo,
                            cluster_name.clone(),
                            ClusterStatus::Error,
                        )?;
                        self.repo
                            .save_log(LogEntry::error(&cluster_name, e.clone()))?;
                        Err(e)
                    }
                }
            }
            Event::AddNodeToCluster {
                access,
                cluster_name,
                node_name,
            } => {
                match usecase::add_node_to_cluster::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone(),
                    node_name.clone(),
                ) {
                    Ok(_) => {
                        self.repo.save_log(LogEntry::info(
                            &cluster_name,
                            format!("Node [{}] has been created", node_name),
                        ))?;

                        let mut cluster = self
                            .repo
                            .get_cluster(&cluster_name)?
                            .ok_or(format!("Cannot find cluster [{}]", cluster_name))?;
                        cluster
                            .nodes
                            .iter_mut()
                            .find(|i| i.name == node_name)
                            .map(|i| i.lock = None)
                            .ok_or(format!("Cannot find node [{}]", node_name))?;

                        self.repo.save_cluster(cluster)?;
                        update_cluster_status(&self.repo, cluster_name, ClusterStatus::Sync)?;
                        info!("Cluster node has been created");
                        Ok(())
                    }
                    Err(e) => {
                        update_cluster_status(
                            &self.repo,
                            cluster_name.clone(),
                            ClusterStatus::Error,
                        )?;
                        self.repo
                            .save_log(LogEntry::error(&cluster_name, e.clone()))?;
                        Err(e)
                    }
                }
            }
            Event::DeleteNodeFromCluster {
                access,
                cluster_name,
                node_name,
            } => {
                match usecase::delete_node_from_cluster::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone(),
                    node_name.clone(),
                ) {
                    Ok(_) => {
                        self.repo.save_log(LogEntry::info(
                            &cluster_name,
                            format!("Node [{}-{}] has been deleted", cluster_name, node_name),
                        ))?;
                        update_cluster_status(
                            &self.repo,
                            cluster_name.clone(),
                            ClusterStatus::Sync,
                        )?;
                        info!(
                            "Cluster node [{}-{}] has been deleted",
                            cluster_name, node_name
                        );
                        Ok(())
                    }
                    Err(e) => {
                        update_cluster_status(
                            &self.repo,
                            cluster_name.clone(),
                            ClusterStatus::Error,
                        )?;
                        self.repo
                            .save_log(LogEntry::error(&cluster_name, e.clone()))?;
                        Err(e)
                    }
                }
            }
            Event::ChangeNodeResources {
                access,
                cluster_name,
                node_name,
                cores,
                memory,
            } => {
                match change_resources::execute(
                    self.proxmox_client.clone(),
                    self.repo.clone(),
                    access,
                    cluster_name.clone(),
                    node_name.clone(),
                    cores,
                    memory,
                ) {
                    Ok(_) => {
                        self.repo.save_log(LogEntry::info(
                            &cluster_name,
                            format!(
                                "Resource for node [{}-{}] has been changed",
                                cluster_name, node_name
                            ),
                        ))?;
                        update_cluster_status(
                            &self.repo,
                            cluster_name.clone(),
                            ClusterStatus::Sync,
                        )?;

                        let mut cluster = self
                            .repo
                            .get_cluster(&cluster_name)?
                            .ok_or(format!("Cannot find cluster [{}]", cluster_name))?;
                        cluster
                            .nodes
                            .iter_mut()
                            .find(|i| i.name == node_name)
                            .map(|i| i.lock = None)
                            .ok_or(format!("Cannot find node [{}]", node_name))?;

                        self.repo.save_cluster(cluster)?;
                        info!(
                            "Resource for node [{}-{}] has been changed",
                            cluster_name, node_name
                        );
                        Ok(())
                    }
                    Err(e) => {
                        update_cluster_status(
                            &self.repo,
                            cluster_name.clone(),
                            ClusterStatus::Error,
                        )?;
                        self.repo
                            .save_log(LogEntry::error(&cluster_name, e.clone()))?;
                        Err(e)
                    }
                }
            }
        }
    }
}

fn update_cluster_status(
    repo: &Repository,
    name: String,
    status: ClusterStatus,
) -> Result<(), String> {
    let mut cluster = repo.get_cluster(&name)?.ok_or("Cannot find cluster")?;
    cluster.status = status;
    repo.save_cluster(cluster)?;
    Ok(())
}
