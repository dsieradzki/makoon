use actix_session::Session;
use actix_web::{get, HttpResponse, Responder, web};

use proxmox::model::Node;

use crate::handlers::actix::inject;
use crate::handlers::error::HandlerError;
use crate::logged_in;

#[get("/api/v1/nodes")]
pub async fn nodes(session: Session, proxmox_client: inject::ProxmoxClient) -> actix_web::Result<impl Responder, HandlerError> {
    let access = logged_in!(session, proxmox_client);

    let result = web::block(move || {
        let result = proxmox_client
            .operations(access)
            .nodes()?;
        Ok::<Vec<Node>, HandlerError>(result)
    }).await??;

    let result: Vec<String> = result.into_iter()
        .map(|i| i.node)
        .collect();

    Ok(HttpResponse::Ok().json(result))
}
