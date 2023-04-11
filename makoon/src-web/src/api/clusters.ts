import {
    ActionLogEntry,
    AppStatus,
    Cluster,
    ClusterHeader,
    ClusterNodeStatus,
    ClusterNodeVmStatus,
    ClusterRequest
} from "@/api/model";
import axios from "axios";

export namespace clusters {
    export function getClusters(): Promise<ClusterHeader[]> {
        return axios.get<ClusterHeader[]>("/api/v1/clusters")
            .then(e => e.data);
    }

    export function getCluster(name: string): Promise<Cluster> {
        return axios.get<Cluster>(`/api/v1/clusters/${name}`).then(e => e.data);
    }

    export function deleteCluster(name: string): Promise<Cluster> {
        return axios.delete(`/api/v1/clusters/${name}`).then(e => e.data);
    }

    export function createCluster(request: ClusterRequest): Promise<void> {
        return axios.post("/api/v1/clusters", request);
    }


    export function generateDefaultClusterConfiguration(): Promise<ClusterRequest> {
        return axios.get("/api/v1/clusters/generate").then(e => e.data);
    }

    export function logsForCluster(name: string): Promise<ActionLogEntry[]> {
        return axios.get(`/api/v1/clusters/${name}/logs`).then(e => e.data);
    }

    export function clusterNodeVmsStatus(clusterName: string): Promise<ClusterNodeVmStatus[]> {
        return axios.get(`/api/v1/clusters/${clusterName}/status/vms`).then(e => e.data);
    }

    export function clusterKubeStatus(clusterName: string): Promise<ClusterNodeStatus[]> {
        return axios.get(`/api/v1/clusters/${clusterName}/status/kube`).then(e => e.data);
    }

}