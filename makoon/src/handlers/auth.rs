use actix_session::Session;
use actix_web::{get, HttpResponse, post, Responder, web};

use proxmox::{Client, model::LoginRequest as ProxmoxLoginRequest};
use proxmox::model::AccessData;

use crate::handlers::actix;
use crate::handlers::actix::{get_session, WebSession};
use crate::handlers::error::HandlerError;
use crate::handlers::model::LoginRequest;

#[post("/api/v1/login")]
pub async fn login(body: web::Json<LoginRequest>,
                   session: Session,
                   proxmox_client: web::Data<Client>) -> actix_web::Result<impl Responder, HandlerError> {
    let access_data = web::block(move || {
        let result = proxmox_client.login(ProxmoxLoginRequest {
            host: body.host.clone(),
            base_path: "/api2/json".to_owned(),
            port: body.port,
            username: body.username.clone(),
            password: body.password.clone(),
        })?;
        Ok::<AccessData, HandlerError>(result)
    }).await??;

    actix::store_session(&session, WebSession {
        access: access_data,
    });

    Ok(HttpResponse::Ok())
}

#[post("/api/v1/logout")]
pub async fn logout(session: Session) -> impl Responder {
    session.purge();
    HttpResponse::Ok().finish()
}

#[get("/api/v1/host-ip")]
pub async fn get_host_ip(session: Session) -> impl Responder {
    get_session(&session)
        .map(|i| i.access.host)
        .map(|i| HttpResponse::Ok().content_type("text/plain").body(i))
        .unwrap_or(HttpResponse::Unauthorized().finish())
}