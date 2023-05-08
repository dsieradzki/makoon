use std::str::FromStr;
use std::sync::{Arc, mpsc};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{Receiver, Sender};
use std::time::Duration;

use proxmox::model::AccessData;

use crate::helm;
use crate::operator::{Error, Result, ssh};
use crate::operator::Dispatcher;
use crate::operator::dispatcher::HELM_CMD;
use crate::operator::event::Event;
use crate::operator::model::{LogEntry, AppStatus, AppStatusType, Cluster, ClusterHeader, ClusterNode, ClusterNodeLock, ClusterNodeStatus, ClusterNodeType, ClusterRequest, ClusterResource, ClusterStatus, HelmApp, kube, KubeStatus};
use crate::operator::model::helm::InstalledRelease;
use crate::operator::repository::Repository;

pub struct Config {
    pub worker_thread_probe_duration: u64,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            worker_thread_probe_duration: 500,
        }
    }
}


pub struct Operator {
    executor: Option<std::thread::JoinHandle<()>>,
    tx: Sender<Event>,
    shutdown: Arc<AtomicBool>,
    repository: Arc<Repository>,
}

impl Drop for Operator {
    fn drop(&mut self) {
        info!("Operator is being deleted");
        self.shutdown.store(true, Ordering::SeqCst);
        match self.executor.take() {
            Some(v) => v.join().expect("cannot join thread"),
            None => info!("Executor not exists")
        }
    }
}

impl Operator {
    pub fn new(config: Config, dispatcher: Dispatcher, repository: Arc<Repository>) -> Self {
        let (tx, rx): (Sender<Event>, Receiver<Event>) = mpsc::channel();
        let shutdown = Arc::new(AtomicBool::from(false));

        Operator {
            repository,
            shutdown: shutdown.clone(),
            tx,
            executor: Some(std::thread::spawn(move || {
                info!("Operator worker thread has been started");
                loop {
                    match rx.try_recv() {
                        Ok(e) => {
                            info!("Event received");
                            match dispatcher.dispatch(e) {
                                Ok(_) => {
                                    info!("Event processing finished successfully");
                                }
                                Err(e) => {
                                    error!("Event processing finished with error: [{}]", e);
                                }
                            };
                        }
                        Err(_) => {
                            std::thread::sleep(Duration::from_millis(config.worker_thread_probe_duration));
                            if shutdown.load(Ordering::SeqCst) {
                                info!("Operator working thread has been requested to shut down");
                                return;
                            }
                        }
                    }
                }
            })),
        }
    }

    pub fn create_cluster(&self, access: AccessData, cluster_request: ClusterRequest) -> Result<()> {
        let cluster_name = cluster_request.cluster_name.clone();

        if (self.repository.get_cluster(&cluster_name)?).is_some() {
            return Err(Error::ResourceAlreadyExists);
        }

        let cluster = Cluster {
            node: cluster_request.node,
            cluster_name: cluster_request.cluster_name.clone(),
            kube_version: Some(cluster_request.kube_version),
            os_image: Some(cluster_request.os_image),
            os_image_storage: Some(cluster_request.os_image_storage),
            cluster_config: "".to_string(),
            ssh_key: cluster_request.ssh_key,
            node_username: cluster_request.node_username,
            node_password: cluster_request.node_password,
            helm_apps: cluster_request.helm_apps.into_iter().map(|mut i| {
                i.id = uuid::Uuid::new_v4().to_string();
                i
            }).collect(),
            cluster_resources: cluster_request.cluster_resources.into_iter().map(|mut i| {
                i.id = uuid::Uuid::new_v4().to_string();
                i
            }).collect(),
            disk_size: cluster_request.disk_size,
            nodes: cluster_request.nodes,
            network: cluster_request.network,
            status: ClusterStatus::Pending,
        };
        self.repository.save_cluster(cluster)?;

        self.tx.send(Event::CreateCluster {
            access,
            cluster_name,
        })?;

        Ok(())
    }

    pub fn change_node_resources(&self, access: AccessData, cluster_name: String, node_name: String, cores: u16, memory: u64) -> Result<()> {
        let mut cluster = self.repository
            .get_cluster(&cluster_name)?
            .ok_or(Error::Generic("Cannot get cluster".to_string()))?;

        for node in cluster.nodes.iter_mut() {
            if node.name == node_name {
                node.lock = Some(ClusterNodeLock::ChangeResources)
            }
        }

        self.repository.save_cluster(cluster)?;

        self.tx.send(Event::ChangeNodeResources {
            access,
            cluster_name,
            node_name,
            cores,
            memory,
        })?;
        Ok(())
    }

    pub fn add_node_cluster(&self, access: AccessData, cluster_name: String, node_request: ClusterNode) -> Result<ClusterNode> {
        let mut cluster = self.repository
            .get_cluster(&cluster_name)?
            .ok_or(Error::Generic("Cannot get cluster".to_string()))?;

        let mut node_request = node_request;
        node_request.lock = Some(ClusterNodeLock::Create);

        cluster.nodes.push(node_request.clone());
        self.repository.save_cluster(cluster)?;
        self.repository.save_log(LogEntry::info(&cluster_name, format!("Adding node [{}] to cluster [{}] has been started", node_request.name, cluster_name)))?;

        self.tx.send(Event::AddNodeToCluster {
            access,
            cluster_name,
            node_name: node_request.name.clone(),
        })?;

        Ok(node_request)
    }

    pub fn delete_cluster(&self, access: AccessData, cluster_name: String) -> Result<()> {
        let mut cluster = self.repository
            .get_cluster(&cluster_name)?
            .ok_or(Error::Generic("Cannot get cluster".to_string()))?;
        cluster.status = ClusterStatus::Destroying;
        self.repository.save_cluster(cluster)?;
        self.repository.save_log(LogEntry::info(&cluster_name, "Cluster deletion started".to_string()))?;

        self.tx.send(Event::DeleteCluster {
            access,
            cluster_name,
        })?;

        Ok(())
    }

    pub fn delete_node_from_cluster(&self, access: AccessData, cluster_name: String, node_name: String) -> Result<ClusterNode> {
        self.repository.save_log(LogEntry::info(&cluster_name, format!("Deleting node [{}] from cluster has been started", node_name)))?;

        let mut cluster = self.repository.get_cluster(&cluster_name)?.ok_or(Error::ResourceNotFound)?;
        let node_to_delete = cluster.nodes.iter_mut()
            .find(|i| i.name == node_name).ok_or(Error::ResourceNotFound)?;
        node_to_delete.lock = Some(ClusterNodeLock::Delete);

        let result = node_to_delete.clone();

        self.repository.save_cluster(cluster)?;

        self.tx.send(Event::DeleteNodeFromCluster {
            access,
            cluster_name,
            node_name,
        })?;
        Ok(result)
    }

    pub fn get_clusters(&self) -> Result<Vec<ClusterHeader>> {
        let repo = self.repository.clone();

        let result = repo.
            get_clusters().
            map(|r| r.into_iter()
                .map(|i| -> ClusterHeader {
                    let cores = i.nodes.
                        iter().
                        map(|i| i.cores).
                        reduce(|a, b| a + b);

                    let memory = i.nodes.
                        iter().
                        map(|i| i.memory).
                        reduce(|a, b| a + b);

                    let node_count = u64::try_from(i.nodes.len()).unwrap_or(0);

                    ClusterHeader {
                        name: i.cluster_name.clone(),
                        cores_sum: cores.unwrap_or(0),
                        memory_sum: memory.unwrap_or(0),
                        disk_size_sum: node_count * i.disk_size,
                        nodes_count: u16::try_from(node_count).unwrap_or_default(),
                        status: i.status,
                    }
                })
                .collect())?;
        Ok(result)
    }

    pub fn cluster_status(&self, cluster_name: &str) -> Result<Vec<ClusterNodeStatus>> {
        let cluster = self.get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        let master_node = cluster.nodes.iter()
            .find(|i| i.node_type == ClusterNodeType::Master).cloned().ok_or(Error::ResourceNotFound)?;


        let mut result: Vec<ClusterNodeStatus> = cluster.nodes.iter().map(|i| ClusterNodeStatus {
            name: format!("{}-{}", cluster.cluster_name, i.name),
            status: KubeStatus::Unknown,
        }).collect();


        let mut ssh_client = ssh::Client::new();
        if ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key).is_err() {
            return Ok(result);
        } else {};
        let nodes_status = ssh_client.execute("sudo microk8s kubectl get nodes -o json --request-timeout='5s'");
        let nodes_status = match nodes_status {
            Ok(v) => v,
            Err(_) => return Ok(result)
        };
        let kube_nodes: kube::Nodes = serde_json::from_str(&nodes_status)?;

        for status in result.iter_mut() {
            let node_status = kube_nodes.items.iter()
                .find(|i| i.metadata.name == status.name)
                .map(|i| i.status.conditions.clone())
                .unwrap_or_default()
                .into_iter()
                .find(|i| i.condition_type == "Ready")
                .map(|i| i.status)
                .unwrap_or_default();
            status.status = KubeStatus::from_str(&node_status).unwrap_or(KubeStatus::Unknown);
        }

        Ok(result)
    }

    pub fn apps_status(&self, cluster_name: &str) -> Result<Vec<AppStatus>> {
        let cluster = self.get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        let master_node = cluster.nodes.iter()
            .find(|i| i.node_type == ClusterNodeType::Master).cloned().ok_or(Error::ResourceNotFound)?;

        let result = cluster.helm_apps.iter().map(|i| AppStatus {
            id: i.id.clone(),
            status: AppStatusType::Unknown,
        }).collect::<Vec<AppStatus>>();

        let mut ssh_client = ssh::Client::new();
        if ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key).is_err() {
            return Ok(result);
        }
        let installed_releases = ssh_client.execute_to(&helm::new(HELM_CMD)
            .sudo()
            .list()
            .all()
            .json()
            .build());

        let installed_releases: Vec<InstalledRelease> = match installed_releases {
            Ok(v) => v,
            Err(_) => return Ok(result)
        };

        Ok(cluster.helm_apps.iter().map(|i| {
            let status = installed_releases.iter()
                .find(|ir| ir.name == i.release_name && ir.namespace == i.namespace)
                .map(|ir| ir.status.clone())
                .unwrap_or(AppStatusType::NotInstalled);

            AppStatus {
                id: i.id.clone(),
                status,
            }
        }).collect())
    }

    pub fn logs_for_cluster(&self, name: String) -> Result<Vec<LogEntry>> {
        Ok(self.repository.logs(name)?)
    }

    pub fn get_cluster(&self, cluster_name: &str) -> Result<Option<Cluster>> {
        Ok(self.repository.get_cluster(cluster_name)?)
    }

    pub fn get_nodes(&self, cluster_name: &str) -> Result<Vec<ClusterNode>> {
        Ok(self.repository.get_cluster(cluster_name)?.ok_or(Error::ResourceNotFound)?.nodes)
    }

    pub fn save_helm_app(&self, cluster_name: &str, app: HelmApp) -> Result<String> {
        let mut cluster = self.repository
            .get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        let app_id = uuid::Uuid::new_v4().to_string();
        let mut app = app;
        app.id = app_id.clone();
        cluster.helm_apps.push(app);
        self.repository.save_cluster(cluster)?;
        Ok(app_id)
    }
    pub fn update_helm_app(&self, cluster_name: &str, app: HelmApp) -> Result<()> {
        let mut cluster = self.repository
            .get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        let app_to_update = cluster.helm_apps.iter_mut()
            .find(|i| i.id == app.id)
            .ok_or(Error::ResourceNotFound)?;

        app_to_update.repository = app.repository;
        app_to_update.chart_version = app.chart_version;
        app_to_update.chart_name = app.chart_name;
        app_to_update.namespace = app.namespace;
        app_to_update.values = app.values;
        app_to_update.wait = app.wait;
        app_to_update.release_name = app.release_name;

        self.repository.save_cluster(cluster)?;
        Ok(())
    }
    pub fn delete_helm_app(&self, cluster_name: &str, app_id: &str) -> Result<()> {
        let mut cluster = self.repository
            .get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        cluster.helm_apps.retain_mut(|i| i.id != app_id);

        self.repository.save_cluster(cluster)?;
        Ok(())
    }
    pub fn install_helm_app(&self, cluster_name: &str, app_id: &str) -> Result<()> {
        let cluster = self.repository
            .get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        let app = cluster.helm_apps.iter()
            .find(|i| i.id == app_id)
            .ok_or(Error::ResourceNotFound)?;

        let master_node = cluster.nodes.iter()
            .find(|i| i.node_type == ClusterNodeType::Master).cloned().ok_or(Error::ResourceNotFound)?;

        let mut ssh_client = ssh::Client::new();
        ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;


        crate::operator::dispatcher::install_helm_app(&ssh_client, app)?;
        Ok(())
    }
    pub fn uninstall_helm_app(&self, cluster_name: &str, app_id: &str) -> Result<()> {
        let cluster = self.repository
            .get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        let app = cluster.helm_apps.iter()
            .find(|i| i.id == app_id)
            .ok_or(Error::ResourceNotFound)?;

        let master_node = cluster.nodes.iter()
            .find(|i| i.node_type == ClusterNodeType::Master).cloned().ok_or(Error::ResourceNotFound)?;

        let mut ssh_client = ssh::Client::new();
        ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;

        ssh_client.execute(&helm::new(HELM_CMD)
            .sudo()
            .uninstall(&app.release_name)
            .namespace(&app.namespace)
            .build())?;

        Ok(())
    }


    pub fn save_cluster_resource(&self, cluster_name: &str, res: ClusterResource) -> Result<String> {
        let mut cluster = self.repository
            .get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        let res_id = uuid::Uuid::new_v4().to_string();
        let mut res = res;
        res.id = res_id.clone();
        cluster.cluster_resources.push(res);
        self.repository.save_cluster(cluster)?;
        Ok(res_id)
    }

    pub fn update_cluster_resource(&self, cluster_name: &str, res: ClusterResource) -> Result<()> {
        let mut cluster = self.repository
            .get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        let res_to_update = cluster.cluster_resources.iter_mut()
            .find(|i| i.id == res.id)
            .ok_or(Error::ResourceNotFound)?;

        res_to_update.name = res.name;
        res_to_update.content = res.content;

        self.repository.save_cluster(cluster)?;
        Ok(())
    }

    pub fn install_cluster_resource(&self, cluster_name: &str, res_id: &str) -> Result<()> {
        let cluster = self.repository
            .get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        let res = cluster.cluster_resources.iter()
            .find(|i| i.id == res_id)
            .ok_or(Error::ResourceNotFound)?;

        let master_node = cluster.nodes.iter()
            .find(|i| i.node_type == ClusterNodeType::Master).cloned().ok_or(Error::ResourceNotFound)?;

        let mut ssh_client = ssh::Client::new();
        ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;


        crate::operator::dispatcher::install_cluster_resource(&ssh_client, res)?;
        Ok(())
    }
    pub fn uninstall_cluster_resource(&self, cluster_name: &str, res_id: &str) -> Result<()> {
        let cluster = self.repository
            .get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        let res = cluster.cluster_resources.iter()
            .find(|i| i.id == res_id)
            .ok_or(Error::ResourceNotFound)?;

        let master_node = cluster.nodes.iter()
            .find(|i| i.node_type == ClusterNodeType::Master).cloned().ok_or(Error::ResourceNotFound)?;

        let mut ssh_client = ssh::Client::new();
        ssh_client.connect(&master_node.ip_address, &cluster.node_username, &cluster.ssh_key.private_key, &cluster.ssh_key.public_key)?;


        let file_name = format!("{}_cluster_resource", res.name.trim().replace(' ', "_"));
        ssh_client.upload_file(format!("/tmp/{}.yaml", file_name).as_str(), res.content.as_str())?;
        ssh_client.execute(format!("sudo microk8s.kubectl delete -f /tmp/{}.yaml", file_name).as_str())?;
        ssh_client.execute(format!("sudo rm /tmp/{}.yaml", file_name).as_str())?;
        Ok(())
    }

    pub fn delete_cluster_resource(&self, cluster_name: &str, res_id: &str) -> Result<()> {
        let mut cluster = self.repository
            .get_cluster(cluster_name)?
            .ok_or(Error::ResourceNotFound)?;

        cluster.cluster_resources.retain_mut(|i| i.id != res_id);

        self.repository.save_cluster(cluster)?;
        Ok(())
    }
}