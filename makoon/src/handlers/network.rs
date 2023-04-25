use actix_session::Session;
use actix_web::{get, HttpResponse, Responder, web};


use crate::handlers::actix::inject;
use crate::handlers::error::HandlerError;
use crate::handlers::model::AvailableNetwork;
use crate::logged_in;

#[get("/api/v1/nodes/{node}/networks/bridges")]
pub async fn networks_bridges(path: web::Path<String>, session: Session, proxmox_client: inject::ProxmoxClient) -> actix_web::Result<impl Responder, HandlerError> {
    let node = path.into_inner();
    let access = logged_in!(session, proxmox_client);


    let result = web::block(
        move || {
            let result = proxmox_client
                .operations(access)
                .networks(&node, Some(proxmox::model::NetworkType::Bridge))?;
            Ok::<Vec<proxmox::model::Network>, HandlerError>(result)
        }).await??;

    let result = result.into_iter()
        .map(|i| AvailableNetwork {
            iface: i.iface,
            address: i.address,
        })
        .collect::<Vec<AvailableNetwork>>();

    Ok(HttpResponse::Ok().json(result))
}