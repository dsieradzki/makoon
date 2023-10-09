use std::fmt::{Debug, Display, Formatter};
use std::sync::PoisonError;

use actix_web::error::BlockingError;
use actix_web::http::StatusCode;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub enum HandlerError {
    BadRequest(String),
    NotFound(String),
    UnAuthorized,
    InternalServerError(String),
}

impl Display for HandlerError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            HandlerError::UnAuthorized => write!(f, ""),
            HandlerError::NotFound(e) => write!(f, "{}", e),
            HandlerError::InternalServerError(e) => write!(f, "{}", e),
            HandlerError::BadRequest(e) => write!(f, "{}", e),
        }
    }
}

impl actix_web::error::ResponseError for HandlerError {
    fn status_code(&self) -> StatusCode {
        match self {
            HandlerError::UnAuthorized => StatusCode::UNAUTHORIZED,
            HandlerError::NotFound(_) => StatusCode::NOT_FOUND,
            HandlerError::InternalServerError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            HandlerError::BadRequest(_) => StatusCode::BAD_REQUEST,
        }
    }
}

impl<T> From<PoisonError<T>> for HandlerError {
    fn from(value: PoisonError<T>) -> Self {
        error!("{}", value);
        HandlerError::InternalServerError(value.to_string())
    }
}

impl From<BlockingError> for HandlerError {
    fn from(value: BlockingError) -> Self {
        error!("{}", value);
        HandlerError::InternalServerError(value.to_string())
    }
}

impl From<proxmox_client::Error> for HandlerError {
    fn from(value: proxmox_client::Error) -> Self {
        match value {
            proxmox_client::Error::Generic(e) => HandlerError::InternalServerError(e),
            proxmox_client::Error::CannotConnectToProxmox(_) => HandlerError::UnAuthorized,
            proxmox_client::Error::CredentialsInvalid => HandlerError::UnAuthorized,
            proxmox_client::Error::HttpError {
                status,
                reason,
                response,
            } => HandlerError::InternalServerError(format!("{}-{}: {}", status, reason, response)),
            proxmox_client::Error::BodyMalformed(e) => HandlerError::InternalServerError(e),
        }
    }
}

impl From<core::Error> for HandlerError {
    fn from(value: core::Error) -> Self {
        match value {
            core::Error::ResourceAlreadyExists => {
                HandlerError::BadRequest("Cluster already exists".to_string())
            }
            core::Error::Generic(e) => HandlerError::InternalServerError(e),
            core::Error::ResourceNotFound => {
                HandlerError::NotFound("Cluster not found".to_string())
            }
        }
    }
}
