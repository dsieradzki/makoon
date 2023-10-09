use proxmox_client::model::VmStatus;
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HelmAppStatus {
    pub id: String,
    pub status: String,
}

#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NodeStatus {
    #[serde(rename = "vmid")]
    pub vm_id: i32,
    pub vm_status: String,
    pub k8s_status: String,
}

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
    pub avail: Option<u64>,
    pub used: Option<u64>,
    pub total: Option<u64>,
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
    pub memory: u64,
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