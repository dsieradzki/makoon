use actix_session::Session;
use actix_web::{get, web, HttpResponse, Responder};

use crate::handlers::actix::inject;
use crate::handlers::error::HandlerError;
use crate::handlers::model::AvailableStorage;
use crate::logged_in;

#[get("/api/v1/nodes/{node}/storage/{storage_content_type}")]
pub async fn storage(
    path: web::Path<(String, proxmox_client::model::StorageContentType)>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
) -> actix_web::Result<impl Responder, HandlerError> {
    let (node, storage_content_type) = path.into_inner();
    let access = logged_in!(session, proxmox_client);

    let result = web::block(move || {
        let result = proxmox_client
            .operations(access)
            .storage(&node, Some(storage_content_type))?;
        Ok::<Vec<proxmox_client::model::Storage>, HandlerError>(result)
    })
        .await??;

    let to_mb = |v: Option<u64>| -> Option<u32> {
        v.map(|v| u32::try_from(v / 1024 / 1024).unwrap_or(u32::MAX))
    };

    let result: Vec<AvailableStorage> = result
        .into_iter()
        .map(|i| AvailableStorage {
            storage: i.storage,
            avail: to_mb(i.avail),
            used: to_mb(i.used),
            total: to_mb(i.total),
        })
        .collect();

    Ok(HttpResponse::Ok().json(result))
}
