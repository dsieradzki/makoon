use std::fmt::{Display, Formatter};
use std::str::FromStr;

use chrono::{NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use typeshare::typeshare;
use crate::model::ClusterState::{Creating, Destroying, Pending};

#[typeshare]
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HelmApp {
    #[serde(default)]
    pub id: String,
    pub chart_name: String,
    #[serde(default)]
    pub chart_version: String,
    pub repository: String,
    pub release_name: String,
    pub namespace: String,
    #[serde(default)]
    pub values: String,
    #[serde(default)]
    pub wait: bool,
}

#[typeshare]
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ClusterResource {
    pub id: String,
    pub name: String,
    pub content: String,
}

#[typeshare]
#[derive(PartialEq, Eq, Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum ClusterNodeType {
    Master,
    Worker,
}

impl Display for ClusterNodeType {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ClusterNodeType::Master => write!(f, "master"),
            ClusterNodeType::Worker => write!(f, "worker"),
        }
    }
}

#[typeshare]
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum ClusterNodeLock {
    Create,
    Delete,
    ChangeResources,
}

#[typeshare]
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ClusterNode {
    pub vm_id: u32,
    pub name: String,
    pub cores: u16,
    #[doc = "Unit: MiB"]
    pub memory: u32,
    pub ip_address: String,
    pub storage_pool: String,
    pub node_type: ClusterNodeType,
    pub lock: Option<ClusterNodeLock>,
}

#[typeshare]
#[derive(Clone, Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct Network {
    pub gateway: String,
    pub subnet_mask: u8,
    pub dns: String,
    pub bridge: String,
}

#[typeshare]
#[derive(Clone, Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct KeyPair {
    pub private_key: String,
    pub public_key: String,
}

#[typeshare]
#[derive(Clone, Eq, PartialEq, Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub enum ClusterState {
    #[default]
    Pending,
    Creating,
    Sync,
    OutOfSync,
    Destroying,
    Error,
}

impl ClusterState {
    pub fn in_progress_state(s: &ClusterState) -> bool {
        *s == Pending || *s == Creating || *s == Destroying
    }
}

#[typeshare]
#[derive(Clone, Eq, PartialEq, Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct ClusterStatus {
    pub state: ClusterState,
    pub last_update: NaiveDateTime,
}

impl From<ClusterState> for ClusterStatus {
    fn from(value: ClusterState) -> Self {
        ClusterStatus {
            state: value,
            last_update: Utc::now().naive_local(),
        }
    }
}

#[typeshare]
#[derive(PartialEq, Eq, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum ActionLogLevel {
    Info,
    Error,
}

#[typeshare]
#[derive(PartialEq, Eq, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub date: NaiveDateTime,
    pub cluster_name: String,
    pub message: String,
    pub level: ActionLogLevel,
}

impl LogEntry {
    pub fn info<T>(cluster_name: &str, message: T) -> Self
        where
            T: ToString,
    {
        LogEntry {
            date: Utc::now().naive_local(),
            cluster_name: cluster_name.to_string(),
            message: message.to_string(),
            level: ActionLogLevel::Info,
        }
    }
    pub fn error<T>(cluster_name: &str, message: T) -> Self
        where
            T: ToString,
    {
        LogEntry {
            date: Utc::now().naive_local(),
            cluster_name: cluster_name.to_string(),
            message: message.to_string(),
            level: ActionLogLevel::Error,
        }
    }
}

#[typeshare]
#[derive(Clone, Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct Cluster {
    pub node: String,
    pub cluster_name: String,
    //TODO: Option is for backward compatibility, will be deleted in next release
    pub os_image: Option<String>,
    //TODO: Option is for backward compatibility, will be deleted in next release
    pub os_image_storage: Option<String>,
    //TODO: Option is for backward compatibility, will be deleted in next release
    pub kube_version: Option<String>,
    pub cluster_config: String,
    pub ssh_key: KeyPair,
    pub node_username: String,
    pub node_password: String,
    pub helm_apps: Vec<HelmApp>,
    pub cluster_resources: Vec<ClusterResource>,
    #[doc = "Disk size id GiB"]
    pub disk_size: u32,
    pub nodes: Vec<ClusterNode>,
    pub network: Network,
    pub status: ClusterStatus,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ClusterRequest {
    pub os_image: String,
    pub os_image_storage: String,
    pub kube_version: String,
    pub node: String,
    pub cluster_name: String,
    pub ssh_key: KeyPair,
    pub node_username: String,
    pub node_password: String,
    pub helm_apps: Vec<HelmApp>,
    pub cluster_resources: Vec<ClusterResource>,
    #[doc = "Unit: GiB"]
    pub disk_size: u32,
    pub nodes: Vec<ClusterNode>,
    pub network: Network,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ClusterHeader {
    pub name: String,
    pub nodes_count: u16,
    pub cores_sum: u16,
    #[doc = "Unit: MiB"]
    pub memory_sum: u32,
    #[doc = "Unit: GiB"]
    pub disk_size_sum: u32,
    pub status: ClusterStatus,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
pub struct ClusterNodeStatus {
    pub name: String,
    pub status: KubeStatus,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum KubeStatus {
    #[serde(rename = "ready")]
    Ready,
    #[serde(rename = "not_ready")]
    NotReady,
    #[serde(rename = "unknown")]
    Unknown,
}

#[typeshare]
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum AppStatusType {
    Unknown,
    Deployed,
    Uninstalled,
    Superseded,
    Failed,
    Uninstalling,
    #[serde(rename = "pending-install")]
    PendingInstall,
    #[serde(rename = "pending-upgrade")]
    PendingUpgrade,
    #[serde(rename = "pending-rollback")]
    PendingRollback,
    #[serde(rename = "not-installed")]
    NotInstalled,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AppStatus {
    pub id: String,
    pub status: AppStatusType,
}

impl FromStr for KubeStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.trim().to_lowercase().as_ref() {
            "true" => Ok(KubeStatus::Ready),
            "false" | "unknown" => Ok(KubeStatus::NotReady),
            _ => Ok(KubeStatus::Unknown),
        }
    }
}

pub mod helm {
    use serde::{Deserialize, Serialize};
    use crate::model::AppStatusType;


    #[derive(Clone, Debug, Deserialize, Serialize)]
    pub struct InstalledRelease {
        pub name: String,
        pub namespace: String,
        pub revision: String,
        pub updated: String,
        pub status: AppStatusType,
        pub chart: String,
        pub app_version: String,
    }
}

pub mod kube {
    use serde::{Deserialize, Serialize};

    #[derive(Clone, Debug, Deserialize, Serialize)]
    pub struct StatusCondition {
        pub status: String,
        #[serde(rename = "type")]
        pub condition_type: String,
    }

    #[derive(Debug, Deserialize, Serialize)]
    pub struct Status {
        pub conditions: Vec<StatusCondition>,
    }

    #[derive(Debug, Deserialize, Serialize)]
    pub struct Metadata {
        pub name: String,
    }

    #[derive(Debug, Deserialize, Serialize)]
    pub struct Item {
        pub status: Status,
        pub metadata: Metadata,
    }

    #[derive(Debug, Deserialize, Serialize)]
    pub struct Nodes {
        pub items: Vec<Item>,
    }
}
