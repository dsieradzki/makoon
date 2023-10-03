use std::collections::HashMap;

pub fn kube_versions() -> Vec<String> {
    vec![
        "1.28/stable".to_string(),
        "1.27/stable".to_string(),
        "1.26/stable".to_string(),
        "1.25/stable".to_string(),
        "1.24/stable".to_string(),
    ]
}

pub fn os_images() -> HashMap<String, String> {
    HashMap::from([
        (
            "Ubuntu Server 22.04 LTS - jammy-server-cloudimg-amd64.img".to_string(),
            "https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img".to_string()
        )
    ])
}