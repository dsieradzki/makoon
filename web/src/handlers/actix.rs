use actix_session::Session;
use serde::{Deserialize, Serialize};

#[macro_export]
macro_rules! logged_in {
    ($session: expr, $proxmox_client: expr) => {{
        let access = crate::handlers::actix::get_session(&$session);
        let access = match access {
            Some(v) => v.access,
            None => return Err(crate::handlers::error::HandlerError::UnAuthorized),
        };

        let access_to_get_permissions = access.clone();
        let proxmox_to_get_permissions = $proxmox_client.clone();
        let permissions_handle = tokio::task::spawn_blocking(move || {
            proxmox_to_get_permissions
                .operations(access_to_get_permissions)
                .permissions()
        });

        match permissions_handle.await.unwrap() {
            Ok(_) => access,
            Err(_) => return Err(crate::handlers::error::HandlerError::UnAuthorized),
        }
    }};
}

pub mod inject {
    use actix_web::web;
    pub type ProxmoxClient = web::Data<proxmox_client::Client>;
    pub type Operator = web::Data<core::Operator>;
}

const SESSION_DATA_KEY: &str = "data";

#[derive(Serialize, Deserialize, Debug)]
pub struct WebSession {
    pub access: proxmox_client::model::AccessData,
}

pub fn store_session(session: &Session, data: WebSession) {
    let session_data = serde_json::to_string(&data).unwrap();
    session.insert(SESSION_DATA_KEY, session_data).unwrap();
}

pub fn get_session(session: &Session) -> Option<WebSession> {
    let result = session.get::<String>(SESSION_DATA_KEY);
    let result = match result {
        Ok(v) => v,
        Err(_) => return None,
    };

    let result = match result {
        Some(v) => v,
        None => return None,
    };

    let result = serde_json::from_str(&result);
    match result {
        Ok(v) => Some(v),
        Err(_) => None,
    }
}
