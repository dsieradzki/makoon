use log::debug;
use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::http::HttpClient;
use crate::model::*;
use crate::Result;

pub struct ClientOperations {
    http: HttpClient,
    token: Token,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Permissions {}

impl ClientOperations {
    pub fn new(http: HttpClient, token: Token) -> Self {
        ClientOperations { http, token }
    }

    pub fn host(&self) -> String {
        self.http.host()
    }

    #[doc = "Create or restore a virtual machine."]
    #[doc = "You need 'VM.Allocate' permissions on /vms/{vmid} or on the VM pool /pool/{pool}. For restore (option 'archive'), it is enough if the user has 'VM.Backup' permission and the VM already exists. If you create disks you need 'Datastore.AllocateSpace' on any used storage."]
    pub fn create_virtual_machine(&self, req: CreateVirtualMachine) -> Result<String> {
        debug!("Create virtual machine");
        Ok(self
            .http
            .post::<CreateVirtualMachine, Data<String>>(
                &self.token,
                format!("/nodes/{}/qemu", req.node).as_str(),
                Some(req),
            )?
            .data)
    }

    #[doc = "Extend volume size."]
    #[doc = r#"Check: ["perm","/vms/{vmid}",["VM.Config.Disk"]]"#]
    pub fn resize_disk(&self, req: ResizeDisk) -> Result<Option<String>> {
        debug!("Resize disk");
        Ok(self
            .http
            .put::<ResizeDisk, Data<Option<String>>>(
                &self.token,
                format!("/nodes/{}/qemu/{}/resize", req.node, req.vm_id).as_str(),
                Some(req),
            )?
            .data)
    }

    #[doc = "Set virtual machine options (asynchrounous API)"]
    /// Check: ["perm","/vms/{vmid}",["VM.Config.Disk","VM.Config.CDROM","VM.Config.CPU","VM.Config.Memory","VM.Config.Network","VM.Config.HWType","VM.Config.Options","VM.Config.Cloudinit"],"any",1]
    pub fn update_config(&self, req: VmConfig) -> Result<Option<String>> {
        debug!("Change VM config");
        Ok(self
            .http
            .post::<VmConfig, Data<Option<String>>>(
                &self.token,
                format!("/nodes/{}/qemu/{}/config", req.node, req.vm_id).as_str(),
                Some(req),
            )?
            .data)
    }

    #[doc = "Change user password."]
    ///Each user is allowed to change his own password. A user can change the password of another user if he has 'Realm.AllocateUser' (on the realm of user <userid>) and 'User.Modify' permission on /access/groups/<group> on a group where user <userid> is member of.
    /// Check: ["or",["userid-param","self"],["and",["userid-param","Realm.AllocateUser"],["userid-group",["User.Modify"]]]]
    /// This API endpoint is not available for API tokens.
    pub fn permissions(&self) -> Result<HashMap<String, HashMap<String, i64>>> {
        debug!("Get permissions");
        Ok(self
            .http
            .get::<Data<HashMap<String, HashMap<String, i64>>>>(&self.token, "/access/permissions")?
            .data)
    }

    #[doc = "Get status for all datastores."]
    #[doc = "Only list entries where you have 'Datastore.Audit' or 'Datastore.AllocateSpace' permissions on '/storage/<storage>'"]
    pub fn storage(
        &self,
        node: &str,
        storage_content_type: Option<StorageContentType>,
    ) -> Result<Vec<Storage>> {
        debug!("Get storage");
        let url = format!("/nodes/{}/storage", node);
        let url = match storage_content_type {
            Some(v) => format!("{}?content={}", url, v),
            None => url,
        };
        Ok(self
            .http
            .get::<Data<Vec<Storage>>>(&self.token, url.as_str())?
            .data)
    }

    #[doc = "Cluster node index."]
    #[doc = "Required permissions: Accessible by all authenticated users."]
    pub fn nodes(&self) -> Result<Vec<Node>> {
        debug!("Get hypervisor nodes");
        Ok(self
            .http
            .get::<Data<Vec<Node>>>(&self.token, "/nodes")?
            .data)
    }

    #[doc = "List available networks."]
    #[doc = "Required permissions: Accessible by all authenticated users."]
    pub fn networks(&self, node: &str, network_type: Option<NetworkType>) -> Result<Vec<Network>> {
        debug!("Get networks");
        let url = format!("/nodes/{}/network", node);
        let url = match network_type {
            Some(v) => format!("{}?type={}", url, v),
            None => url,
        };
        Ok(self
            .http
            .get::<Data<Vec<Network>>>(&self.token, url.as_str())?
            .data)
    }

    #[doc = "Virtual machine index (per node)."]
    #[doc = "Required permissions: Only list VMs where you have VM.Audit permissons on /vms/<vmid>."]
    pub fn virtual_machines(&self, node: &str, full: Option<bool>) -> Result<Vec<VirtualMachine>> {
        debug!("Get virtual machines");
        let url = format!("/nodes/{}/qemu", node);
        let url = match full {
            Some(v) => format!("{}?full={}", url, if v { "1" } else { "0" }),
            None => url,
        };

        Ok(self
            .http
            .get::<Data<Vec<VirtualMachine>>>(&self.token, url.as_str())?
            .data)
    }

    #[doc = "LXC container index (per node)."]
    #[doc = "Required permissions: Only list CTs where you have VM.Audit permissons on /vms/<vmid>."]
    pub fn lxc_containers(&self, node: &str) -> Result<Vec<LxcContainer>> {
        debug!("Get LCX containers");
        Ok(self
            .http
            .get::<Data<Vec<LxcContainer>>>(&self.token, format!("/nodes/{}/lxc", node).as_str())?
            .data)
    }

    #[doc = "Start virtual machine."]
    /// Check: ["#perm","/vms/{vmid}",["VM.PowerMgmt"]]
    pub fn start_vm(&self, node: &str, vm_id: u32) -> Result<String> {
        debug!("Start VM [{}]", vm_id);
        Ok(self
            .http
            .post::<(), Data<String>>(
                &self.token,
                format!("/nodes/{}/qemu/{}/status/start", node, vm_id).as_str(),
                None,
            )?
            .data)
    }

    #[doc = "Path: /nodes/{node}/qemu/{vmid}/status/shutdown. Shutdown virtual machine. This is similar to pressing the power button on a physical machine.This will send an ACPI event for the guest OS, which should then proceed to a clean shutdown."]
    /// Check: ["#perm","/vms/{vmid}",["VM.PowerMgmt"]]
    pub fn shutdown_vm(&self, node: &str, vm_id: u32) -> Result<String> {
        debug!("Shutdown VM [{}]", vm_id);
        Ok(self
            .http
            .post::<(), Data<String>>(
                &self.token,
                format!("/nodes/{}/qemu/{}/status/shutdown", node, vm_id).as_str(),
                None,
            )?
            .data)
    }

    #[doc = "Stop virtual machine. The qemu process will exit immediately. Thisis akin to pulling the power plug of a running computer and may damage the VM data"]
    /// Check: ["#perm","/vms/{vmid}",["VM.PowerMgmt"]]
    pub fn stop_vm(&self, node: &str, vm_id: u32) -> Result<String> {
        debug!("Stop VM [{}]", vm_id);
        Ok(self
            .http
            .post::<(), Data<String>>(
                &self.token,
                format!("/nodes/{}/qemu/{}/status/stop", node, vm_id).as_str(),
                None,
            )?
            .data)
    }

    #[doc = "Destroy the VM and all used/owned volumes. Removes any VM specific permissions and firewall rules."]
    /// Check: ["#perm","/vms/{vmid}",["VM.Allocate"]]
    pub fn delete_vm(&self, node: &str, vm_id: u32) -> Result<String> {
        debug!("Delete VM [{}]", vm_id);
        Ok(self
            .http
            .delete::<Data<String>>(
                &self.token,
                format!("/nodes/{}/qemu/{}", node, vm_id).as_str(),
            )?
            .data)
    }

    #[doc = "Get virtual machine status."]
    pub fn status_vm(&self, node: &str, vm_id: u32) -> Result<VmCurrentStatus> {
        Ok(self
            .http
            .get::<Data<VmCurrentStatus>>(
                &self.token,
                format!("/nodes/{}/qemu/{}/status/current", node, vm_id).as_str(),
            )?
            .data)
    }

    #[doc = "Download templates and ISO images by using an URL."]
    #[doc = r#"Check: ["and",["perm","/storage/{storage}",["Datastore.AllocateTemplate"]],["perm","/",["Sys.Audit","Sys.Modify"]]]"#]
    pub fn download_image(&self, req: DownloadImage) -> Result<String> {
        Ok(self
            .http
            .post::<DownloadImage, Data<String>>(
                &self.token,
                format!("/nodes/{}/storage/{}/download-url", req.node, req.storage).as_str(),
                Some(req),
            )?
            .data)
    }

    #[doc = "List storage content."]
    #[doc = r#"Check: ["perm","/storage/{storage}",["Datastore.Audit","Datastore.AllocateSpace"],"any",1]"#]
    pub fn storage_content(&self, node: &str, storage: &str) -> Result<Vec<StorageContent>> {
        Ok(self
            .http
            .get::<Data<Vec<StorageContent>>>(
                &self.token,
                format!("/nodes/{}/storage/{}/content", node, storage).as_str(),
            )?
            .data)
    }

    #[doc = "Get volume attributes"]
    #[doc = "You need read access for the volume."]
    pub fn storage_content_details(
        &self,
        node: &str,
        storage: &str,
        volid: &str,
    ) -> Result<StorageContentDetails> {
        Ok(self
            .http
            .get::<Data<StorageContentDetails>>(
                &self.token,
                format!("/nodes/{}/storage/{}/content/{}", node, storage, volid).as_str(),
            )?
            .data)
    }
}
