use std::string::ToString;

use proxmox::ClientOperations;
use proxmox::model::{NetworkType, StorageContentType};

use crate::operator::{Error, Result};
use crate::operator::model::{ClusterNode, ClusterNodeType, ClusterRequest, HelmApp, KeyPair, Network};

const EMPTY: String = String::new();

pub struct DefaultClusterConfigurationGenerator {
    proxmox_client: ClientOperations,
}

impl DefaultClusterConfigurationGenerator {
    pub fn new(proxmox_client: ClientOperations) -> Self {
        DefaultClusterConfigurationGenerator {
            proxmox_client
        }
    }

    pub fn generate(&self) -> Result<ClusterRequest> {
        let default_proxmox_node = get_default_proxmox_node(&self.proxmox_client)?;
        let default_iso_storage = get_default_iso_storage(&self.proxmox_client, &default_proxmox_node)?;
        let default_disk_storage = get_default_disk_storage(&self.proxmox_client, &default_proxmox_node)?;
        let default_network = get_default_network(&self.proxmox_client, &default_proxmox_node)?;
        let default_start_vm_id = get_default_start_vm_id(&self.proxmox_client, &default_proxmox_node)?;
        Ok(ClusterRequest {
            os_image: "https://cloud-images.ubuntu.com/kinetic/current/kinetic-server-cloudimg-amd64.img".to_string(),
            os_image_storage: default_iso_storage,
            kube_version: "1.24/stable".to_string(),
            node: default_proxmox_node.clone(),
            cluster_name: EMPTY,
            ssh_key: KeyPair {
                private_key: EMPTY,
                public_key: EMPTY,
            },
            node_username: "makoon".to_string(),
            node_password: "makoon".to_string(),
            helm_apps: vec![],
            cluster_resources: vec![],
            disk_size: 32,
            nodes: vec![ClusterNode {
                vm_id: default_start_vm_id,
                name: "master-1".to_string(),
                cores: 2,
                memory: 2048,
                ip_address: "".to_string(),
                storage_pool: default_disk_storage,
                node_type: ClusterNodeType::Master,
            }],
            network: Network {
                gateway: default_network.gateway.clone().unwrap_or_default(),
                subnet_mask: default_network.netmask.unwrap_or("24".to_string()).parse::<u8>().unwrap_or(24),
                dns: default_network.gateway.unwrap_or_default(),
                bridge: default_network.iface,
            },
        })
    }
}

fn get_default_start_vm_id(proxmox_client: &ClientOperations, node: &String) -> Result<u32> {
    let mut used_vm_ids: Vec<u32> = proxmox_client
        .virtual_machines(node.clone(), None)?.iter()
        .map(|i| i.vm_id)
        .collect();
    used_vm_ids.extend(proxmox_client.lxc_containers(node.clone())?.iter()
        .map(|i| &i.vm_id)
        .map(|i| i.parse::<u32>().unwrap_or_default())
        .collect::<Vec<u32>>());

    used_vm_ids.sort();

    find_empty_slot_for_vm_ids(&mut used_vm_ids)
}

fn find_empty_slot_for_vm_ids(used_vm_ids: &Vec<u32>) -> Result<u32> {
    for x in (100..999_999_999).step_by(10) {
        let range_already_used = used_vm_ids.iter().filter(|i| **i >= x && **i <= x + 10).count() > 0;
        if range_already_used {
            continue;
        } else {
            return Ok(x);
        }
    }
    Err(Error::Generic("Cannot find free slot".to_string()))
}


fn get_default_network(proxmox_client: &ClientOperations, node: &str) -> Result<proxmox::model::Network> {
    let bridges = proxmox_client.networks(node.to_string(), Some(NetworkType::Bridge))?;
    Ok(bridges.into_iter()
        .find(|i| {
            let address = i.address.clone().unwrap_or_default();
            address == proxmox_client.host()
        })
        .unwrap_or_default())
}

fn get_default_iso_storage(proxmox_client: &ClientOperations, node: &str) -> Result<String> {
    let result = proxmox_client.storage(node.to_string(), Some(StorageContentType::Iso))?;
    result.get(0)
        .map(|i| i.storage.clone())
        .ok_or(Error::ResourceNotFound)
}


fn get_default_disk_storage(proxmox_client: &ClientOperations, node: &str) -> Result<String> {
    let result = proxmox_client.storage(node.to_string(), Some(StorageContentType::Images))?;
    result.get(0)
        .map(|i| i.storage.clone())
        .ok_or(Error::ResourceNotFound)
}

fn get_default_proxmox_node(proxmox_client: &ClientOperations) -> Result<String> {
    let nodes = proxmox_client.nodes()?;
    nodes.get(0)
        .map(|i| i.node.clone())
        .ok_or(Error::ResourceNotFound)
}

#[cfg(test)]
mod test {
    use crate::operator::generator::find_empty_slot_for_vm_ids;

    #[test]
    fn find_slot_with_first_taken() {
        let result = find_empty_slot_for_vm_ids(&vec![100]).unwrap();
        assert_eq!(result, 110);
    }

    #[test]
    fn find_slot_with_taken_in_first_slot() {
        let result = find_empty_slot_for_vm_ids(&vec![105]).unwrap();
        assert_eq!(result, 110);
    }

    #[test]
    fn find_slot_with_taken_in_first_and_second_slot() {
        let result = find_empty_slot_for_vm_ids(&vec![105, 112]).unwrap();
        assert_eq!(result, 120);
    }


    #[test]
    fn find_slot_with_taken_in_three_slots() {
        let result = find_empty_slot_for_vm_ids(&vec![105, 112, 129]).unwrap();
        assert_eq!(result, 130);
    }
}