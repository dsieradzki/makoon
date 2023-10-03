use actix_web::{get, HttpResponse, Responder};
use crate::handlers::error::HandlerError;
use crate::handlers::model::AvailableKubeVersion;
use crate::handlers::model::AvailableOsImage;

#[get("/api/v1/os-images")]
pub async fn os_images() -> actix_web::Result<impl Responder, HandlerError> {
    let result: Vec<AvailableOsImage> = core::supported::os_images().iter()
        .map(|(k, v)| AvailableOsImage::new(k, v))
        .collect();

    Ok(HttpResponse::Ok().json(result))
}

#[get("/api/v1/kube-versions")]
pub async fn kube_versions() -> actix_web::Result<impl Responder, HandlerError> {
    let result: Vec<AvailableKubeVersion> = core::supported::kube_versions().iter()
        .map(|e| AvailableKubeVersion::new(e))
        .collect();

    Ok(HttpResponse::Ok().json(result))
}