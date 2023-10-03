use log::trace;

use reqwest::blocking::RequestBuilder;
use reqwest::header::{ACCEPT, CONTENT_TYPE};
use serde::{Deserialize, Serialize};

use crate::model::Token;
use crate::{Error, Result};

pub struct HttpClient {
    client: reqwest::blocking::Client,
    host: String,
    port: u16,
    base_path: String,
}

impl HttpClient {
    pub fn new(host: String, port: u16, base_path: String) -> Self {
        let client = reqwest::blocking::Client::builder()
            .danger_accept_invalid_certs(true)
            .pool_max_idle_per_host(0)
            .build()
            .unwrap();
        HttpClient {
            client,
            host,
            port,
            base_path,
        }
    }
    pub fn host(&self) -> String {
        self.host.clone()
    }

    pub fn client(&self) -> &reqwest::blocking::Client {
        &self.client
    }

    pub fn get<T>(&self, token: &Token, path: &str) -> Result<T>
    where
        for<'a> T: Serialize + Deserialize<'a>,
    {
        let req = self.client.get(self.url(path));
        self.do_request(req, token)
    }

    pub fn delete<T>(&self, token: &Token, path: &str) -> Result<T>
    where
        for<'a> T: Serialize + Deserialize<'a>,
    {
        let req = self.client.delete(self.url(path));
        self.do_request(req, token)
    }
    pub fn post<B: Serialize, T>(&self, token: &Token, path: &str, body: Option<B>) -> Result<T>
    where
        for<'a> T: Deserialize<'a>,
    {
        let req = self.client.post(self.url(path));

        let req = match body {
            Some(v) => req.header(CONTENT_TYPE, "application/json").json(&v),
            None => req,
        };

        self.do_request(req, token)
    }

    pub fn put<B: Serialize, T>(&self, token: &Token, path: &str, body: Option<B>) -> Result<T>
    where
        for<'a> T: Deserialize<'a>,
    {
        let req = self.client.put(self.url(path));

        let req = match body {
            Some(v) => req.header(CONTENT_TYPE, "application/json").json(&v),
            None => req,
        };

        self.do_request(req, token)
    }

    fn url(&self, path: &str) -> String {
        format!(
            "https://{}:{}{}{}",
            self.host, self.port, self.base_path, path
        )
    }

    fn do_request<T>(&self, request: RequestBuilder, token: &Token) -> Result<T>
    where
        for<'a> T: Deserialize<'a>,
    {
        let request = request
            .header(ACCEPT, "application/json")
            .header("CSRFPreventionToken", token.csrf_prevention_token.clone())
            .header(
                reqwest::header::COOKIE,
                format!("PVEAuthCookie={}", token.ticket.clone()),
            );

        trace!("Request: {:#?}", request);
        let response = request.send()?;
        let status = response.status();
        let result = match status.as_u16() {
            200..=299 => response.text()?,
            x => {
                trace!("Error response: {:#?}", response);
                return Err(Error::HttpError {
                    status: x,
                    reason: status.canonical_reason().unwrap_or_default().to_string(),
                    response: response.text().unwrap_or_default(),
                });
            }
        };

        serde_json::from_str(&result).map_err(|e| Error::BodyMalformed(e.to_string()))
    }
}
