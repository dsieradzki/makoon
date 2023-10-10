import {
    ChangeNodeResourcesRequest,
    Cluster,
    ClusterHeader,
    ClusterNode,
    ClusterNodeStatus,
    ClusterNodeVmStatus,
    ClusterRequest, LogEntry
} from "@/api/model";
import axios from "axios";

export namespace clusters {
    export function getClusters(): Promise<ClusterHeader[]> {
        return axios.get("/api/v1/clusters").then(e => e.data);
    }

    export function getCluster(name: string): Promise<Cluster> {
        return axios.get(`/api/v1/clusters/${name}`).then(e => e.data);
    }

    export function getClusterNodes(name: string): Promise<ClusterNode[]> {
        return axios.get(`/api/v1/clusters/${name}/nodes`).then(e => e.data);
    }

    export function deleteCluster(name: string): Promise<void> {
        return axios.delete(`/api/v1/clusters/${name}`).then(e => e.data);
    }

    export function deleteNodeFromCluster(clusterName: string, nodeName: string): Promise<ClusterNode> {
        return axios.delete(`/api/v1/clusters/${clusterName}/nodes/${nodeName}`).then(e => e.data);
    }

    export function changeNodeResources(clusterName: string, nodeName: string, cores: number, memory: number): Promise<void> {
        return axios.put(`/api/v1/clusters/${clusterName}/nodes/${nodeName}/resources`, {
            cores,
            memory
        } as ChangeNodeResourcesRequest).then(e => e.data);
    }

    export function createCluster(request: ClusterRequest): Promise<void> {
        return axios.post("/api/v1/clusters", request);
    }

    export function addNodeToCluster(clusterName: string, request: ClusterNode): Promise<ClusterNode> {
        return axios.post(`/api/v1/clusters/${clusterName}/nodes`, request).then(e => e.data);
    }

    export function generateDefaultClusterConfiguration(): Promise<ClusterRequest> {
        return axios.get("/api/v1/clusters/generate").then(e => e.data);
    }

    export function logsForCluster(name: string): Promise<LogEntry[]> {
        return axios.get(`/api/v1/clusters/${name}/logs`).then(e => e.data);
    }
    export function clearLogsForCluster(name: string): Promise<LogEntry[]> {
        return axios.delete(`/api/v1/clusters/${name}/logs`).then(e => e.data);
    }

    export function clusterNodeVmsStatus(clusterName: string): Promise<ClusterNodeVmStatus[]> {
        return axios.get(`/api/v1/clusters/${clusterName}/status/vms`).then(e => e.data);
    }

    export function clusterKubeStatus(clusterName: string): Promise<ClusterNodeStatus[]> {
        return axios.get(`/api/v1/clusters/${clusterName}/status/kube`).then(e => e.data);
    }

}