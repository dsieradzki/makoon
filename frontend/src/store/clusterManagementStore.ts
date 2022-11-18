import { makeAutoObservable, runInAction } from "mobx";
import { k4p, management } from "@wails/models";
import {
    AddHelmChart, AddK8sResource,
    DeleteHelmChart, DeleteK8sResource,
    GetHelpAppsStatus,
    GetNodesStatus,
    InstallHelmChart, InstallK8sResource,
    UninstallHelmChart, UninstallK8sResource,
    UpdateHelmChartData, UpdateK8sResourcesData
} from "@wails/management/Service";
import { LogDebug } from "@wails-runtime/runtime";
import { LoadCluster } from "@wails/database/Service";
import { apiCall } from "@/utils/api";
import { wrapWithProcessingIndicator } from "@/store/processingIndicatorStoreUi";


export const LOADING_INDICATOR_UNINSTALL_HELM_CHART = "LOADING_INDICATOR_UNINSTALL_HELM_CHART"
export const LOADING_INDICATOR_DELETE_HELM_CHART = "LOADING_INDICATOR_DELETE_HELM_CHART"
export const LOADING_INDICATOR_UPDATE_HELM_CHARTS_STATUS = "LOADING_INDICATOR_UPDATE_HELM_CHARTS_STATUS"

export const LOADING_INDICATOR_INSTALL_K8S_RESOURCE = "LOADING_INDICATOR_INSTALL_K8S_RESOURCE"
export const LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE = "LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE"
export const LOADING_INDICATOR_DELETE_K8S_RESOURCE = "LOADING_INDICATOR_DELETE_K8S_RESOURCE"


function vmIdAsc(a: k4p.KubernetesNode, b: k4p.KubernetesNode): number {
    return a.vmid - b.vmid;
}

export type VmStatus = "up" | "down" | "loading";
export type K8sStatus = "ready" | "not_ready" | "unknown" | "loading";

export class KubernetesNodeWithStatus extends k4p.KubernetesNode {
    vmStatus: VmStatus = "loading";
    k8sStatus: K8sStatus = "loading";

    constructor(node: k4p.KubernetesNode, vmStatus: VmStatus, k8sStatus: K8sStatus) {
        super(node);
        this.vmStatus = vmStatus;
        this.k8sStatus = k8sStatus;
    }
}

export class HelmAppWithStatus extends k4p.HelmApp {
    status: management.HelmAppStatus

    constructor(app: k4p.HelmApp, status: management.HelmAppStatus) {
        super(app);
        this.status = status
    }
}

class ClusterManagementStore {
    nodesStatus: management.NodeStatus[] = [];
    helmAppsStatus: management.HelmAppStatus[] = [];
    cluster: k4p.Cluster = {} as k4p.Cluster


    constructor() {
        makeAutoObservable(this)
    }

    get masterNodesWithStatus() {
        return (this.cluster.nodes || [])
            .filter(e => e.nodeType == "master")
            .sort(vmIdAsc)
            .map(e => {
                const nodeStatus = this.nodesStatus.find(s => s.vmid === e.vmid);
                if (!nodeStatus) {
                    return new KubernetesNodeWithStatus(e, "loading", "loading")
                }
                return new KubernetesNodeWithStatus(e, nodeStatus.vmStatus as VmStatus, nodeStatus.k8SStatus as K8sStatus)
            })
    }

    get workerNodesWithStatus() {
        return (this.cluster.nodes || [])
            .filter(e => e.nodeType == "worker")
            .sort(vmIdAsc)
            .map(e => {
                const nodeStatus = this.nodesStatus.find(s => s.vmid === e.vmid);
                if (!nodeStatus) {
                    return new KubernetesNodeWithStatus(e, "loading", "loading")
                }
                return new KubernetesNodeWithStatus(e, nodeStatus.vmStatus as VmStatus, nodeStatus.k8SStatus as K8sStatus)
            })
    }

    get helmAppsWithStatus() {
        return (this.cluster.helmApps || [])
            .map(e => {
                const status = this.helmAppsStatus.find(s => s.id == e.id)
                if (!status) {
                    return new HelmAppWithStatus(e, {
                        id: e.id,
                        status: "loading"
                    } as management.HelmAppStatus)
                }
                return new HelmAppWithStatus(e, status)
            })
    }

    get helmApps() {
        return this.cluster.helmApps || []
    }

    get k8SResources() {
        return this.cluster.k8SResources || []
    }

    async loadProject(clusterName: string) {
        const cluster = await apiCall(() => LoadCluster(clusterName));
        runInAction(() => {
            this.cluster = cluster
            this.nodesStatus = []
        })
    }

    async updateNodesStatus() {
        if (!this.cluster?.clusterName) {
            return
        }
        LogDebug("Update nodes status");
        const updatedNodeStatuses = await apiCall(() => GetNodesStatus(this.cluster.clusterName))
        runInAction(() => {
            this.nodesStatus = updatedNodeStatuses;
        })
    }

    async updateAppsStatus() {
        let result = await apiCall(() => GetHelpAppsStatus(this.cluster.clusterName), LOADING_INDICATOR_UPDATE_HELM_CHARTS_STATUS)
        runInAction(() => {
            this.helmAppsStatus = result
        })
    }

    findNode(id: number): k4p.KubernetesNode | undefined {
        return this.cluster.nodes.find(e => e.vmid === id)
    }


    async addHelmChart(app: k4p.HelmApp): Promise<string> {
        app.id = await apiCall(() => AddHelmChart(this.cluster.clusterName, app))
        runInAction(() => {
            if (!this.cluster.helmApps) {
                this.cluster.helmApps = []
            }
            this.cluster.helmApps.push(app);
            this.updateAppsStatus()
        })
        return app.id
    }

    async updateHelmChart(app: k4p.HelmApp) {
        runInAction(() => {
            const index = this.cluster.helmApps.findIndex((e: k4p.HelmApp) => e.id == app.id);
            this.cluster.helmApps[index] = app;
        })
        await apiCall(() => UpdateHelmChartData(this.cluster.clusterName, app))
    }

    async installHelmChartWithoutHandleGlobalErrorHandling(id: string) {
        try {
            await InstallHelmChart(this.cluster.clusterName, id)
        } finally {
            await this.updateAppsStatus()
        }
    }

    async uninstallHelmChart(id: string) {
        await apiCall(() => UninstallHelmChart(this.cluster.clusterName, id), LOADING_INDICATOR_UNINSTALL_HELM_CHART)
        await this.updateAppsStatus()
    }

    async deleteHelmChart(id: string) {
        await apiCall(() => DeleteHelmChart(this.cluster.clusterName, id), LOADING_INDICATOR_DELETE_HELM_CHART)
        runInAction(() => {
            this.cluster.helmApps = this.cluster.helmApps.filter(e => e.id != id)
        })
    }

    async addK8sResources(cks: k4p.K8sResource): Promise<string> {
        cks.id = await apiCall(() => AddK8sResource(this.cluster.clusterName, cks))
        runInAction(() => {
            if (!this.cluster.k8SResources) {
                this.cluster.k8SResources = []
            }
            this.cluster.k8SResources.push(cks);
        })
        return cks.id
    }

    async updateK8sResources(kr: k4p.K8sResource) {
        runInAction(() => {
            const index = this.cluster.k8SResources.findIndex((e: k4p.K8sResource) => e.id == kr.id);
            this.cluster.k8SResources[index] = kr;
        })
        await apiCall(() => UpdateK8sResourcesData(this.cluster.clusterName, kr))
    }

    async installK8sResourcesWithoutGlobalErrorHandling(id: string) {
        await wrapWithProcessingIndicator(
            LOADING_INDICATOR_INSTALL_K8S_RESOURCE,
            () => InstallK8sResource(this.cluster.clusterName, id))
    }

    async uninstallK8sResourcesWithoutErrorHandling(id: string) {
        await wrapWithProcessingIndicator(
            LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE,
            () => UninstallK8sResource(this.cluster.clusterName, id))

    }

    async deleteK8sResources(id: string) {
        await apiCall(() => DeleteK8sResource(this.cluster.clusterName, id), LOADING_INDICATOR_DELETE_K8S_RESOURCE)
        runInAction(() => {
            this.cluster.k8SResources = this.cluster.k8SResources.filter((e: k4p.K8sResource) => e.id !== id);
        })
    }
}

const clusterManagementStore = new ClusterManagementStore()
export default clusterManagementStore