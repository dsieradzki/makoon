#[macro_use]
extern crate log;

use std::env;
use std::io::ErrorKind;
use std::sync::Arc;

use actix_session::storage::CookieSessionStore;
use actix_session::SessionMiddleware;
use actix_web::cookie::Key;
use actix_web::middleware::Logger;
use actix_web::{get, web, App, HttpResponse, HttpServer, Responder};
use env_logger::Env;
use mime_guess::from_path;
use rust_embed::RustEmbed;

use crate::handlers::actix::inject;

mod handlers;
#[derive(RustEmbed)]
#[folder = "src-web/dist/"]
struct Asset;

fn handle_embedded_file(path: &str) -> HttpResponse {
    match Asset::get(path) {
        Some(content) => HttpResponse::Ok()
            .content_type(from_path(path).first_or_octet_stream().as_ref())
            .body(content.data.into_owned()),
        None => HttpResponse::NotFound().body("404 Not Found"),
    }
}

#[get("/{_:.*}")]
async fn static_files(path: web::Path<String>) -> impl Responder {
    handle_embedded_file(if path.is_empty() {
        "index.html"
    } else {
        path.as_str()
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(Env::default().default_filter_or("info"));
    let db_location = env::var("MAKOON_DB_PATH").unwrap_or("./makoon".to_string());
    let server_port: u16 = env::var("MAKOON_SERVER_PORT")
        .unwrap_or("8080".to_string())
        .parse()
        .map_err(|_| std::io::Error::from(ErrorKind::InvalidInput))?;

    let proxmox_client = Arc::new(proxmox_client::Client::new());
    let repo = Arc::new(
        core::Repository::new(&db_location)
            .map_err(|_| std::io::Error::from(ErrorKind::InvalidData))?,
    );

    let operator = core::Operator::new(
        core::Config::default(),
        core::Dispatcher::new(proxmox_client.clone(), repo.clone()),
        repo.clone(),
    );
    let operator = inject::Operator::new(operator);

    let session_encryption_key = Key::generate();
    HttpServer::new(move || {
        App::new()
            .app_data(inject::ProxmoxClient::from(proxmox_client.clone()))
            .app_data(operator.clone())
            .wrap(
                SessionMiddleware::builder(
                    CookieSessionStore::default(),
                    session_encryption_key.clone(),
                )
                .cookie_http_only(false)
                .cookie_secure(false)
                .build(),
            )
            .wrap(Logger::default())
            .service(handlers::auth::get_host_ip)
            .service(handlers::auth::login)
            .service(handlers::auth::logout)
            .service(handlers::cluster::generate_default_cluster_configuration)
            .service(handlers::cluster::get_clusters)
            .service(handlers::cluster::get_cluster)
            .service(handlers::cluster::get_nodes)
            .service(handlers::cluster::create_cluster)
            .service(handlers::cluster::delete_cluster)
            .service(handlers::cluster::logs_for_cluster)
            .service(handlers::cluster::clear_logs_for_cluster)
            .service(handlers::cluster::cluster_vm_status)
            .service(handlers::cluster::cluster_kube_status)
            .service(handlers::cluster::add_node_to_cluster)
            .service(handlers::cluster::delete_node_from_cluster)
            .service(handlers::cluster::change_node_resources)
            .service(handlers::apps::apps_status)
            .service(handlers::apps::save_helm_app)
            .service(handlers::apps::update_helm_app)
            .service(handlers::apps::delete_helm_app)
            .service(handlers::apps::install_helm_app)
            .service(handlers::apps::uninstall_helm_app)
            .service(handlers::cluster_resources::save_cluster_resources)
            .service(handlers::cluster_resources::update_cluster_resources)
            .service(handlers::cluster_resources::delete_cluster_resources)
            .service(handlers::cluster_resources::install_cluster_resources)
            .service(handlers::cluster_resources::uninstall_cluster_resources)
            .service(handlers::network::networks_bridges)
            .service(handlers::nodes::nodes)
            .service(handlers::storage::storage)
            .service(handlers::export::export_cluster_data)
            .service(handlers::settings::os_images)
            .service(handlers::settings::kube_versions)
            .service(static_files)
    })
    .bind(("0.0.0.0", server_port))?
    .run()
    .await
}
