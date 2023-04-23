use proxmox::model::AccessData;

#[derive(Debug)]
pub enum Event {
    CreateCluster {
        access: AccessData,
        cluster_name: String,
    },
    AddNodeToCluster {
        access: AccessData,
        cluster_name: String,
        node_name: String,
    },
    DeleteNodeFromCluster {
        access: AccessData,
        cluster_name: String,
        node_name: String,
    },
    DeleteCluster {
        access: AccessData,
        cluster_name: String,
    },
}
