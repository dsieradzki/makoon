use actix_session::Session;
use actix_web::{delete, get, http::header::ContentType, post, put, web, HttpResponse, Responder};

use crate::handlers::actix::inject;
use crate::handlers::error::HandlerError;
use crate::logged_in;

#[get("/api/v1/clusters/{name}/apps/status")]
pub async fn apps_status(
    path: web::Path<String>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
    operator: inject::Operator,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let name = path.into_inner();

    let result = web::block(move || operator.apps_status(&name)).await??;

    Ok(HttpResponse::Ok().json(result))
}

#[post("/api/v1/clusters/{name}/apps")]
pub async fn save_helm_app(
    path: web::Path<String>,
    body: web::Json<core::model::HelmApp>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
    operator: inject::Operator,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let name = path.into_inner();

    let result = web::block(move || operator.save_helm_app(&name, body.0)).await??;

    Ok(HttpResponse::Ok()
        .content_type(ContentType::plaintext())
        .body(result))
}

#[put("/api/v1/clusters/{name}/apps")]
pub async fn update_helm_app(
    path: web::Path<String>,
    body: web::Json<core::model::HelmApp>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
    operator: inject::Operator,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let name = path.into_inner();

    web::block(move || operator.update_helm_app(&name, body.0)).await??;

    Ok(HttpResponse::Ok().finish())
}

#[delete("/api/v1/clusters/{name}/apps/{app_id}")]
pub async fn delete_helm_app(
    path: web::Path<(String, String)>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
    operator: inject::Operator,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let (name, app_id) = path.into_inner();

    web::block(move || operator.delete_helm_app(&name, &app_id)).await??;

    Ok(HttpResponse::Ok().finish())
}

#[post("/api/v1/clusters/{name}/apps/{app_id}/install")]
pub async fn install_helm_app(
    path: web::Path<(String, String)>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
    operator: inject::Operator,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let (name, app_id) = path.into_inner();

    web::block(move || operator.install_helm_app(&name, &app_id)).await??;

    Ok(HttpResponse::Ok().finish())
}

#[delete("/api/v1/clusters/{name}/apps/{app_id}/uninstall")]
pub async fn uninstall_helm_app(
    path: web::Path<(String, String)>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
    operator: inject::Operator,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let (name, app_id) = path.into_inner();

    web::block(move || operator.uninstall_helm_app(&name, &app_id)).await??;

    Ok(HttpResponse::Ok().finish())
}
