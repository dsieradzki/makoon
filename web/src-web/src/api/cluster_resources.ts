import { ClusterResource } from "@/api/model";
import axios from "axios";

export namespace cluster_resources {
    export function saveClusterResource(clusterName: string, app: ClusterResource): Promise<string> {
        return axios.post(`/api/v1/clusters/${clusterName}/cluster-resources`, app).then(e => e.data);
    }

    export function updateClusterResource(clusterName: string, app: ClusterResource): Promise<void> {
        return axios.put(`/api/v1/clusters/${clusterName}/cluster-resources`, app);
    }

    export function deleteClusterResource(clusterName: string, resId: string): Promise<void> {
        return axios.delete(`/api/v1/clusters/${clusterName}/cluster-resources/${resId}`);
    }

    export function installClusterResource(clusterName: string, resId: string): Promise<void> {
        return axios.post(`/api/v1/clusters/${clusterName}/cluster-resources/${resId}/install`);
    }

    export function uninstallClusterResource(clusterName: string, resId: string): Promise<void> {
        return axios.delete(`/api/v1/clusters/${clusterName}/cluster-resources/${resId}/uninstall`);
    }

}
