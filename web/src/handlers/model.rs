use serde::{Deserialize, Serialize};
use typeshare::typeshare;


#[typeshare]
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
}

#[typeshare]
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize, Debug)]
pub enum VmStatus {
    #[serde(rename = "running")]
    Running,
    #[serde(rename = "stopped")]
    Stopped,
}

impl From<&proxmox_client::model::VmStatus> for VmStatus {
    fn from(value: &proxmox_client::model::VmStatus) -> Self {
        match value {
            proxmox_client::model::VmStatus::Running => VmStatus::Running,
            proxmox_client::model::VmStatus::Stopped => VmStatus::Stopped
        }
    }
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ClusterNodeVmStatus {
    #[serde(rename = "vmid")]
    pub vm_id: u32,
    pub status: VmStatus,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AvailableStorage {
    pub storage: String,
    #[doc = "Unit: MiB"]
    pub avail: Option<u32>,
    #[doc = "Unit: MiB"]
    pub used: Option<u32>,
    #[doc = "Unit: MiB"]
    pub total: Option<u32>,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AvailableNetwork {
    pub iface: String,
    pub address: Option<String>,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChangeNodeResourcesRequest {
    pub cores: u16,
    #[doc = "Unit: MiB"]
    pub memory: u32,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AvailableOsImage {
    pub name: String,
    pub url: String,
}

impl AvailableOsImage {
    pub fn new(name: &str, url: &str) -> Self {
        AvailableOsImage {
            name: name.to_string(),
            url: url.to_string(),
        }
    }
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AvailableKubeVersion {
    pub version: String,
}

impl AvailableKubeVersion {
    pub fn new(version: &str) -> Self {
        AvailableKubeVersion {
            version: version.to_string()
        }
    }
}