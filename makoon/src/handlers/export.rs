use actix_session::Session;
use actix_web::{get, HttpResponse, web};
use actix_web::http::header::CONTENT_DISPOSITION;
use actix_web::http::StatusCode;
use mime_guess::mime::TEXT_PLAIN;
use serde::{Deserialize, Serialize};

use crate::handlers::actix::inject;
use crate::handlers::error::HandlerError;
use crate::logged_in;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportType {
    PrivateKey,
    PublicKey,
    KubeConfig,
}

#[get("/api/v1/clusters/{cluster_name}/export/{export_type}")]
pub async fn export_cluster_data(path: web::Path<(String, ExportType)>, session: Session, operator: inject::Operator, proxmox_client: inject::ProxmoxClient) -> actix_web::Result<HttpResponse, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let (cluster_name, export_type) = path.into_inner();

    let cluster = operator.lock().map_err(HandlerError::from)?
        .get_cluster(&cluster_name)?
        .ok_or(HandlerError::NotFound("Cluster not found".to_string()))?;

    let (key, file_name) = match export_type {
        ExportType::PrivateKey => (cluster.ssh_key.private_key, cluster_name),
        ExportType::PublicKey => (cluster.ssh_key.public_key, format!("{}.pub", cluster_name)),
        ExportType::KubeConfig => (cluster.cluster_config, "config".to_string()),
    };

    let response = HttpResponse::build(StatusCode::OK)
        .content_type(TEXT_PLAIN)
        .append_header((CONTENT_DISPOSITION, format!("attachment; filename=\"{}\"", file_name)))
        .body(key);
    Ok(response)
}
