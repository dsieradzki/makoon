use std::time::Duration;
use web::core::model::ClusterStatus;
use web::model::LoginRequest;

mod common;

const CLUSTER_NAME:&str = "e2e-test";

#[cfg(feature = "e2e")]
#[test]
fn test_add_and_delete_small_cluster() {
    let makoon_host = std::env::var("MAKOON_HOST").unwrap_or("http://localhost:5173".to_string());
    let proxmox_host = std::env::var("PROXMOX_HOST").unwrap();
    let proxmox_user = std::env::var("PROXMOX_USER").unwrap();
    let proxmox_password = std::env::var("PROXMOX_PASSWORD").unwrap();



    let makoon_client = common::Client::new(makoon_host);
    makoon_client.login(LoginRequest {
        host: proxmox_host,
        port: 8006,
        username: proxmox_user,
        password: proxmox_password,
    });


    let os_images = makoon_client.os_images();
    let kube_versions = makoon_client.kube_versions();

    for os_image in os_images.iter() {
        for kube_version in kube_versions.iter() {
            println!("-> Cluster test: OS [{}], kube version: [{}]", &os_image.name, &kube_version.version);
            clean_clusters(&makoon_client);
            create_and_destroy(&makoon_client, &os_image.url, &kube_version.version)
        }
    }

}
fn create_and_destroy(makoon_client: &common::Client, os_image: &str, kube_version: &str) {
    let mut cluster_request = makoon_client.generate_default_cluster();
    cluster_request.cluster_name = CLUSTER_NAME.to_string();
    cluster_request.nodes[0].ip_address = "192.168.1.210".to_string();
    cluster_request.os_image = os_image.to_string();
    cluster_request.kube_version = kube_version.to_string();

    makoon_client.create_cluster(&cluster_request);
    let mut probes = 40;
    loop {
        if probes == 0 {
            panic!("Cannot create cluster");
        }
        let cluster = makoon_client.get_cluster(&cluster_request.cluster_name);
        if cluster.status == ClusterStatus::Sync {
            println!("Cluster created");
            break;
        } else if cluster.status == ClusterStatus::Error {
            panic!("Cannot create cluster");
        } else {
            println!("Cluster in status [{:?}], wait 10 sec", cluster.status);
            std::thread::sleep(Duration::from_secs(10));
            probes -= 1;
        }
    }
    makoon_client.delete_cluster(&cluster_request.cluster_name)
}
fn clean_clusters(client: &common::Client) {
    println!("Setup");
    let clusters = client.clusters();
    let exists = clusters.iter().find(|e|e.name == CLUSTER_NAME).is_some();
    if exists {
        println!("Cluster [{}] already exists, delete cluster to prepare environment", CLUSTER_NAME);
        client.delete_cluster(CLUSTER_NAME);
    }
    let mut probes = 10;
    loop {
        let clusters = client.clusters();
        let exists = clusters.iter().find(|e|e.name == CLUSTER_NAME).is_some();
        if exists {
            std::thread::sleep(Duration::from_secs(3));
            probes -= 1;
        } else {
            break;
        }
        if probes == 0 {
            panic!("Cannot delete cluster");
        }
    }

}