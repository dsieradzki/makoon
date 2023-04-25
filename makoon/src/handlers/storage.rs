use actix_session::Session;
use actix_web::{get, HttpResponse, Responder, web};


use crate::handlers::actix::inject;
use crate::handlers::error::HandlerError;
use crate::handlers::model::AvailableStorage;
use crate::logged_in;

#[get("/api/v1/nodes/{node}/storage/{storage_content_type}")]
pub async fn storage(path: web::Path<(String, proxmox::model::StorageContentType)>, session: Session, proxmox_client: inject::ProxmoxClient) -> actix_web::Result<impl Responder, HandlerError> {
    let (node, storage_content_type) = path.into_inner();
    let access = logged_in!(session, proxmox_client);

    let result = web::block(move || {
        let result = proxmox_client
            .operations(access)
            .storage(&node, Some(storage_content_type))?;
        Ok::<Vec<proxmox::model::Storage>, HandlerError>(result)
    }).await??;

    let result: Vec<AvailableStorage> = result.into_iter()
        .map(|i| AvailableStorage {
            storage: i.storage,
            avail: i.avail,
            used: i.used,
            total: i.total,
        })
        .collect();

    Ok(HttpResponse::Ok().json(result))
}