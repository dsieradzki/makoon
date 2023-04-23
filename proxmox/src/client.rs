use std::time::Duration;
use reqwest::header::CONTENT_TYPE;
use crate::{Result, Error, to_url_encoded};
use crate::client_operations::ClientOperations;
use crate::http::{HttpClient};
use crate::model::*;

pub struct Client {}


impl Default for Client {
    fn default() -> Self {
        Client::new()
    }
}



impl Client {
    pub fn new() -> Self {
        Client {}
    }

    pub fn login(&self, options: LoginRequest) -> Result<AccessData> {
        let http = HttpClient::new(
            options.host.clone(),
            options.port,
            options.base_path.clone());

        let response = http.client()
            .post(format!("https://{}:{}{}/access/ticket?password={}", options.host, options.port, options.base_path, to_url_encoded(&options.password)))
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .body(format!("username={}@pam", options.username))
            .timeout(Duration::from_secs(10))
            .send()?;

        match response.status().as_u16() {
            200..=299 => {
                let token = response.json::<Data<Token>>()?.data;
                Ok(AccessData {
                    token,
                    host: options.host,
                    port: options.port,
                    base_path: options.base_path,
                })
            }
            401 => Err(Error::CredentialsInvalid),
            c => Err(Error::Generic(format!("Login to proxmox returned [{}] code", c)))
        }
    }
    pub fn operations(&self, access: AccessData) -> ClientOperations {
        let http = HttpClient::new(
            access.host,
            access.port,
            access.base_path);

        ClientOperations::new(http, access.token)
    }
}

