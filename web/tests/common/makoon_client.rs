use reqwest::header::CONTENT_TYPE;
use web::core::model::{Cluster, ClusterHeader, ClusterRequest};
use web::model::{AvailableKubeVersion, AvailableOsImage, LoginRequest};

pub struct Client {
    client: reqwest::blocking::Client,
    host: String,
}

impl Client {
    pub fn new(host: String) -> Client {
        Client {
            host,
            client: reqwest::blocking::Client::builder()
                .danger_accept_invalid_certs(true)
                .pool_max_idle_per_host(0)
                .cookie_store(true)
                .build()
                .unwrap(),
        }
    }

    pub fn login(&self, login: LoginRequest) {
        let url = format!("{}{}", self.host, "/api/v1/login");

        let request = self.client.post(url).json(&login);
        let response = request.send().unwrap();
        if !response.status().is_success() {
            panic!("Cannot login");
        }
    }
    pub fn clusters(&self) -> Vec<ClusterHeader> {
        let url = format!("{}{}", self.host, "/api/v1/clusters");

        let request = self.client.get(url);
        let response = request.send().unwrap();
        let clusters: Vec<ClusterHeader> = serde_json::from_str(response.text().unwrap().as_str()).unwrap();
        clusters
    }

    pub fn generate_default_cluster(&self) -> ClusterRequest {
        let url = format!("{}{}", self.host, "/api/v1/clusters/generate");

        let request = self.client.get(url);
        let response = request.send().unwrap();
        let clusters: ClusterRequest = serde_json::from_str(response.text().unwrap().as_str()).unwrap();
        clusters
    }

    pub fn create_cluster(&self, request: &ClusterRequest) {
        let url = format!("{}{}", self.host, "/api/v1/clusters");

        let request = self.client.post(url)
            .header(CONTENT_TYPE, "application/json")
            .json(request);

        let response = request.send().unwrap();
        if !response.status().is_success() {
            panic!("Cannot create cluster [{}] - [{}]", response.status().to_string(), response.text().unwrap());
        }
    }

    pub fn get_cluster(&self, cluster_name: &str) -> Cluster {
        let url = format!("{}{}{}", self.host, "/api/v1/clusters/", cluster_name);

        let request = self.client.get(url);
        let response = request.send().unwrap();
        let cluster: Cluster = serde_json::from_str(response.text().unwrap().as_str()).unwrap();
        cluster
    }
    pub fn delete_cluster(&self, cluster_name: &str) {
        let url = format!("{}{}{}", self.host, "/api/v1/clusters/", cluster_name);

        let request = self.client.delete(url);

        let response = request.send().unwrap();
        if !response.status().is_success() {
            panic!("Cannot delete cluster");
        }
    }
    pub fn os_images(&self) -> Vec<AvailableOsImage> {
        let url = format!("{}{}", self.host, "/api/v1/os-images");

        let request = self.client.get(url);
        let response = request.send().unwrap();
        let result: Vec<AvailableOsImage> = serde_json::from_str(response.text().unwrap().as_str()).unwrap();
        result
    }

    pub fn kube_versions(&self) -> Vec<AvailableKubeVersion> {
        let url = format!("{}{}", self.host, "/api/v1/kube-versions");

        let request = self.client.get(url);
        let response = request.send().unwrap();
        let result: Vec<AvailableKubeVersion> = serde_json::from_str(response.text().unwrap().as_str()).unwrap();
        result
    }
}