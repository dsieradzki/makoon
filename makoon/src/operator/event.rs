use proxmox::model::AccessData;

#[derive(Debug)]
pub enum Event {
    CreateCluster {
        access: AccessData,
        cluster_name: String,
        os_image: String,
        os_image_storage: String,
        kube_version: String,
    },
    DeleteCluster {
        access: AccessData,
        cluster_name: String,
    },
}
