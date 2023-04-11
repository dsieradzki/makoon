use std::io::Read;
use std::io::Write;
use std::net::TcpStream;
use std::path::Path;
use serde::Deserialize;

pub struct Client {
    port: u16,
    session: Option<ssh2::Session>,
}

impl Client {
    pub fn new() -> Self {
        Client {
            session: None,
            port: 22,
        }
    }

    pub fn set_port(&mut self, port: u16) -> Result<(), String> {
        match &self.session {
            Some(_) => Err("Cannot chage port when connection is established".to_string()),
            None => {
                self.port = port;
                Ok(())
            }
        }
    }
    pub fn connect(&mut self, ip_address: &str, username: &str, private_key: &str, public_key: &str) -> Result<(), String> {
        let tcp = TcpStream::connect(format!("{}:22", ip_address)).map_err(|e| e.to_string())?;
        let mut session = ssh2::Session::new().map_err(|e| e.to_string())?;
        session.set_tcp_stream(tcp);
        session.handshake().map_err(|e| e.to_string())?;
        session.userauth_pubkey_memory(
            username,
            Some(public_key),
            private_key,
            None,
        ).map_err(|e| e.to_string())?;
        self.session = Some(session);
        Ok(())
    }

    pub fn is_file_exists(&self, file_path: &str) -> Result<bool, String> {
        let session = self.session.as_ref().ok_or("Client not connected".to_string())?;
        let sftp = session.sftp().unwrap();
        let stats = sftp.stat(Path::new(file_path));
        match stats {
            Ok(_) => Ok(true),
            Err(e) => {
                if e.message() == "no such file" {
                    Ok(false)
                } else {
                    Ok(false)
                }
            }
        }
    }

    pub fn upload_file(&self, file_path: &str, content: &str) -> Result<(), String> {
        let session = self.session.as_ref().ok_or("Client not connected".to_string())?;
        let content = content.as_bytes();
        let content_length = u64::try_from(content.len()).map_err(|e| e.to_string())?;

        let mut remote_file = session
            .scp_send(Path::new(file_path),
                      0o644,
                      content_length,
                      None).map_err(|e| e.to_string())?;
        remote_file.write(content).map_err(|e| e.to_string())?;
        // Close the channel and wait for the whole content to be transferred
        remote_file.send_eof().map_err(|e| e.to_string())?;
        remote_file.wait_eof().map_err(|e| e.to_string())?;
        remote_file.close().map_err(|e| e.to_string())?;
        remote_file.wait_close().map_err(|e| e.to_string())?;
        Ok(())
    }
    pub fn execute(&self, command: &str) -> Result<String, String> {
        let session = self.session.as_ref().ok_or("Client not connected".to_string())?;
        let mut channel = session.channel_session().map_err(|e| e.to_string())?;
        channel.exec(command).map_err(|e| e.to_string())?;
        let mut out = String::new();
        channel.read_to_string(&mut out).map_err(|e| e.to_string())?;
        channel.wait_close().map_err(|e| e.to_string())?;

        let exit_code = channel.exit_status().map_err(|e| e.to_string()).map_err(|e| e.to_string())?;
        match exit_code {
            0 => Ok(out),
            _ => {
                let mut err_out = String::new();
                channel.stderr().read_to_string(&mut err_out).map_err(|e| e.to_string())?;
                Err(format!("Exit code: [{}], output: [{}]", exit_code, err_out))
            }
        }
    }
    pub fn execute_to<T>(&self, command: &str) -> Result<T, String>
        where for<'a> T: Deserialize<'a> {
        let output = self.execute(command)?;
        serde_json::from_str(&output).map_err(|e| e.to_string())
    }
}