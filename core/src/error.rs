use std::fmt::{Display, Formatter};
use std::sync::mpsc::SendError;
use crate::db::repository;


#[derive(Debug)]
pub enum Error {
    ResourceNotFound,
    ResourceAlreadyExists,
    Generic(String),
}

impl From<repository::Error> for Error {
    fn from(value: repository::Error) -> Self {
        match value {
            repository::Error::IO(e) => Error::Generic(e),
            repository::Error::DB(e) => Error::Generic(e),
        }
    }
}

impl From<proxmox_client::Error> for Error {
    fn from(value: proxmox_client::Error) -> Self {
        match value {
            proxmox_client::Error::Generic(e) => Error::Generic(e),
            proxmox_client::Error::CannotConnectToProxmox(e) => Error::Generic(e),
            proxmox_client::Error::CredentialsInvalid => Error::Generic(String::new()),
            proxmox_client::Error::HttpError {
                status,
                response,
                reason,
            } => Error::Generic(format!(
                "Http status: [{}], reason: [{}], response: [{}]",
                status, reason, response
            )),
            proxmox_client::Error::BodyMalformed(e) => Error::Generic(e),
        }
    }
}

impl<T> From<SendError<T>> for Error {
    fn from(value: SendError<T>) -> Self {
        Error::Generic(value.to_string())
    }
}

impl From<serde_json::Error> for Error {
    fn from(value: serde_json::Error) -> Self {
        Error::Generic(value.to_string())
    }
}

impl From<String> for Error {
    fn from(value: String) -> Self {
        Error::Generic(value)
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::ResourceAlreadyExists => write!(f, "Cluster already exists"),
            Error::Generic(e) => write!(f, "Unknown error: {}", e),
            Error::ResourceNotFound => write!(f, "Cluster not found"),
        }
    }
}
