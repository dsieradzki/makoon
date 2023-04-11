use std::fmt::{Display, Formatter};
use std::sync::mpsc::SendError;

use crate::operator::repository;

#[derive(Debug)]
pub enum Error {
    ResourceNotFound,
    ResourceAlreadyExists,
    Generic(String),
}

impl From<repository::Error> for Error {
    fn from(value: repository::Error) -> Self {
        match value {
            repository::Error::ReadingError(e) => Error::Generic(e),
            repository::Error::WritingError(e) => Error::Generic(e)
        }
    }
}

impl From<proxmox::Error> for Error {
    fn from(value: proxmox::Error) -> Self {
        match value {
            proxmox::Error::Generic(e) => Error::Generic(e),
            proxmox::Error::CannotConnectToProxmox(e) => Error::Generic(e),
            proxmox::Error::CredentialsInvalid => Error::Generic(String::new()),
            proxmox::Error::HttpError { status, response, reason } => Error::Generic(format!("Http status: [{}], reason: [{}], response: [{}]", status, reason, response)),
            proxmox::Error::BodyMalformed(e) => Error::Generic(e)
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
            Error::ResourceNotFound => write!(f, "Cluster not found")
        }
    }
}