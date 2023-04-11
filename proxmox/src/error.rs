use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum Error {
    Generic(String),
    CannotConnectToProxmox(String),
    CredentialsInvalid,
    HttpError {
        status: u16,
        reason: String,
        response: String,
    },
    BodyMalformed(String),
}

impl From<reqwest::Error> for Error {
    fn from(value: reqwest::Error) -> Self {
        match value.is_connect() || value.is_timeout() {
            true => Error::CannotConnectToProxmox(value.to_string()),
            false => Error::Generic(value.to_string())
        }
    }
}

impl From<Error> for String {
    fn from(value: Error) -> Self {
        value.to_string()
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::CannotConnectToProxmox(e) => write!(f, "Cannot connect to Proxmox: [{}]", e),
            Error::CredentialsInvalid => write!(f, "Credentials invalid"),
            Error::Generic(e) => write!(f, "Generic error: [{}]", e),
            Error::HttpError { status, reason, response } => write!(f, "Http status: [{}], reason: [{}], response: [{}]", status, reason, response),
            Error::BodyMalformed(e) => write!(f, "Body malformed: [{}]", e),
        }
    }
}