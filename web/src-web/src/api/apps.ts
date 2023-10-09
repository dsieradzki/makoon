import { AppStatus, HelmApp } from "@/api/model";
import axios from "axios";

export namespace apps {

    export function appsStatus(clusterName: string): Promise<AppStatus[]> {
        return axios.get(`/api/v1/clusters/${clusterName}/apps/status`).then(e => e.data);
    }

    export function saveHelmApp(clusterName: string, app: HelmApp): Promise<string> {
        return axios.post(`/api/v1/clusters/${clusterName}/apps`, app).then(e => e.data);
    }

    export function updateHelmApp(clusterName: string, app: HelmApp): Promise<void> {
        return axios.put(`/api/v1/clusters/${clusterName}/apps`, app);
    }

    export function deleteHelmApp(clusterName: string, appId: string): Promise<void> {
        return axios.delete(`/api/v1/clusters/${clusterName}/apps/${appId}`);
    }

    export function installHelmApp(clusterName: string, appId: string): Promise<void> {
        return axios.post(`/api/v1/clusters/${clusterName}/apps/${appId}/install`);
    }


    export function uninstallHelmApp(clusterName: string, appId: string): Promise<void> {
        return axios.delete(`/api/v1/clusters/${clusterName}/apps/${appId}/uninstall`);
    }
}