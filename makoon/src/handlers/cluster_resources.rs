use actix_session::Session;
use actix_web::{delete, http::header::ContentType, HttpResponse, post, put, Responder, web};

use crate::handlers::actix::inject;
use crate::handlers::error::HandlerError;
use crate::logged_in;
use crate::operator::model::ClusterResource;

#[post("/api/v1/clusters/{name}/cluster-resources")]
pub async fn save_cluster_resources(path: web::Path<String>, body: web::Json<ClusterResource>, session: Session, proxmox_client: inject::ProxmoxClient, operator: inject::Operator) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let name = path.into_inner();

    let result = web::block(move || operator.save_cluster_workload(&name, body.0)).await??;

    Ok(HttpResponse::Ok()
        .content_type(ContentType::plaintext())
        .body(result))
}

#[put("/api/v1/clusters/{name}/cluster-resources")]
pub async fn update_cluster_resources(path: web::Path<String>, body: web::Json<ClusterResource>, session: Session, proxmox_client: inject::ProxmoxClient, operator: inject::Operator) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let name = path.into_inner();

    web::block(move || operator.update_cluster_workload(&name, body.0)).await??;

    Ok(HttpResponse::Ok())
}

#[delete("/api/v1/clusters/{name}/cluster-resources/{res_id}")]
pub async fn delete_cluster_resources(path: web::Path<(String, String)>, session: Session, proxmox_client: inject::ProxmoxClient, operator: inject::Operator) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let (name, res_id) = path.into_inner();

    web::block(move || operator.delete_cluster_workload(&name, &res_id)).await??;

    Ok(HttpResponse::Ok())
}


#[post("/api/v1/clusters/{name}/cluster-resources/{res_id}/install")]
pub async fn install_cluster_resources(path: web::Path<(String, String)>, session: Session, proxmox_client: inject::ProxmoxClient, operator: inject::Operator) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let (name, res_id) = path.into_inner();

    web::block(move || operator.install_cluster_workload(&name, &res_id)).await??;

    Ok(HttpResponse::Ok())
}

#[delete("/api/v1/clusters/{name}/cluster-resources/{res_id}/uninstall")]
pub async fn uninstall_cluster_resources(path: web::Path<(String, String)>, session: Session, proxmox_client: inject::ProxmoxClient, operator: inject::Operator) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let (name, res_id) = path.into_inner();

    web::block(move || operator.uninstall_cluster_workload(&name, &res_id)).await??;

    Ok(HttpResponse::Ok())
}
