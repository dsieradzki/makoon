use actix_session::Session;
use actix_web::{delete, get, post, put, web, HttpResponse, Responder};

use proxmox_client::model::VirtualMachine;

use crate::handlers::actix::inject;
use crate::handlers::error::HandlerError;
use crate::handlers::model::{ChangeNodeResourcesRequest, ClusterNodeVmStatus};
use crate::logged_in;

#[get("/api/v1/clusters/{cluster_name}/nodes")]
pub async fn get_nodes(
    path: web::Path<String>,
    session: Session,
    operator: inject::Operator,
    proxmox_client: inject::ProxmoxClient,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);

    let cluster_name = path.into_inner();

    let result = operator.get_nodes(&cluster_name)?;

    Ok(HttpResponse::Ok().json(result))
}

#[post("/api/v1/clusters/{cluster_name}/nodes")]
pub async fn add_node_to_cluster(
    body: web::Json<core::model::ClusterNode>,
    path: web::Path<String>,
    session: Session,
    operator: inject::Operator,
    proxmox_client: inject::ProxmoxClient,
) -> actix_web::Result<impl Responder, HandlerError> {
    let access = logged_in!(session, proxmox_client);
    let cluster_name = path.into_inner();

    let added_node = operator.add_node_cluster(access, cluster_name, body.0)?;
    Ok(HttpResponse::Created().json(added_node))
}

#[put("/api/v1/clusters/{cluster_name}/nodes/{node_name}/resources")]
pub async fn change_node_resources(
    body: web::Json<ChangeNodeResourcesRequest>,
    path: web::Path<(String, String)>,
    session: Session,
    operator: inject::Operator,
    proxmox_client: inject::ProxmoxClient,
) -> actix_web::Result<impl Responder, HandlerError> {
    let access = logged_in!(session, proxmox_client);
    let (cluster_name, node_name) = path.into_inner();
    operator.change_node_resources(access, cluster_name, node_name, body.cores, body.memory)?;
    Ok(HttpResponse::Accepted())
}

#[post("/api/v1/clusters")]
pub async fn create_cluster(
    body: web::Json<core::model::ClusterRequest>,
    session: Session,
    operator: inject::Operator,
    proxmox_client: inject::ProxmoxClient,
) -> actix_web::Result<impl Responder, HandlerError> {
    let access = logged_in!(session, proxmox_client);

    operator.create_cluster(access, body.0)?;
    Ok(HttpResponse::Created().finish())
}

#[get("/api/v1/clusters")]
pub async fn get_clusters(
    session: Session,
    operator: inject::Operator,
    proxmox_client: inject::ProxmoxClient,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let result = operator.get_clusters()?;
    Ok(HttpResponse::Ok().json(result))
}

#[get("/api/v1/clusters/{name}")]
pub async fn get_cluster(
    path: web::Path<String>,
    session: Session,
    operator: inject::Operator,
    proxmox_client: inject::ProxmoxClient,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);

    let name = path.into_inner();

    let result = operator
        .get_cluster(&name)?
        .ok_or(HandlerError::NotFound("Cluster not found".to_string()))?;

    Ok(HttpResponse::Ok().json(result))
}

#[delete("/api/v1/clusters/{name}")]
pub async fn delete_cluster(
    path: web::Path<String>,
    session: Session,
    operator: inject::Operator,
    proxmox_client: inject::ProxmoxClient,
) -> actix_web::Result<impl Responder, HandlerError> {
    let access = logged_in!(session, proxmox_client);
    let name = path.into_inner();

    operator.delete_cluster(access, name)?;
    Ok(HttpResponse::Ok().finish())
}

#[delete("/api/v1/clusters/{cluster_name}/nodes/{node_name}")]
pub async fn delete_node_from_cluster(
    path: web::Path<(String, String)>,
    session: Session,
    operator: inject::Operator,
    proxmox_client: inject::ProxmoxClient,
) -> actix_web::Result<impl Responder, HandlerError> {
    let access = logged_in!(session, proxmox_client);
    let (cluster_name, node_name) = path.into_inner();

    let deleted_node = operator.delete_node_from_cluster(access, cluster_name, node_name)?;
    Ok(HttpResponse::Ok().json(deleted_node))
}

#[get("/api/v1/clusters/generate")]
pub async fn generate_default_cluster_configuration(
    session: Session,
    proxmox_client: inject::ProxmoxClient,
) -> actix_web::Result<impl Responder, HandlerError> {
    let access = logged_in!(session, proxmox_client);

    let result = web::block(move || {
        let generator =
            core::DefaultClusterConfigurationGenerator::new(proxmox_client.operations(access));
        Ok::<core::model::ClusterRequest, HandlerError>(generator.generate()?)
    })
        .await??;

    Ok(HttpResponse::Ok().json(result))
}

#[get("/api/v1/clusters/{name}/logs")]
pub async fn logs_for_cluster(
    path: web::Path<String>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
    operator: inject::Operator,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);

    let name = path.into_inner();

    let result =
        web::block(move || Ok::<Vec<core::model::LogEntry>, HandlerError>(operator.logs_for_cluster(&name)?))
            .await??;

    Ok(HttpResponse::Ok().json(result))
}

#[delete("/api/v1/clusters/{name}/logs")]
pub async fn clear_logs_for_cluster(
    path: web::Path<String>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
    operator: inject::Operator,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);

    let name = path.into_inner();

    web::block(move || {
        operator.clear_logs_for_cluster(&name)?;
        Ok::<(), HandlerError>(())
    })
        .await??;

    Ok(HttpResponse::Ok())
}

#[get("/api/v1/clusters/{name}/status/vms")]
pub async fn cluster_vm_status(
    path: web::Path<String>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
    operator: inject::Operator,
) -> actix_web::Result<impl Responder, HandlerError> {
    let access = logged_in!(session, proxmox_client);
    let name = path.into_inner();

    let cluster = web::block(move || {
        let result = operator.get_cluster(&name)?;
        Ok::<Option<core::model::Cluster>, HandlerError>(result)
    })
        .await??
        .ok_or(HandlerError::NotFound("Cluster not found".to_string()))?;

    let vms = web::block(move || {
        let result = proxmox_client
            .operations(access)
            .virtual_machines(&cluster.node, None)?;
        Ok::<Vec<VirtualMachine>, HandlerError>(result)
    })
        .await??;

    let cluster_vm_ids = cluster.nodes.iter().map(|i| i.vm_id).collect::<Vec<u32>>();

    let result = vms
        .iter()
        .filter(|i| cluster_vm_ids.contains(&i.vm_id))
        .map(|i| ClusterNodeVmStatus {
            vm_id: i.vm_id,
            status: crate::handlers::model::VmStatus::from(&i.status),
        })
        .collect::<Vec<ClusterNodeVmStatus>>();

    Ok(HttpResponse::Ok().json(result))
}

#[get("/api/v1/clusters/{name}/status/kube")]
pub async fn cluster_kube_status(
    path: web::Path<String>,
    session: Session,
    proxmox_client: inject::ProxmoxClient,
    operator: inject::Operator,
) -> actix_web::Result<impl Responder, HandlerError> {
    let _ = logged_in!(session, proxmox_client);
    let name = path.into_inner();

    let result = web::block(move || operator.cluster_status(&name)).await??;

    Ok(HttpResponse::Ok().json(result))
}
