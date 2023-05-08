import {makeAutoObservable, runInAction} from "mobx";

import {apiCall} from "@/utils/api";
import {wrapWithProcessingIndicator} from "@/store/processingIndicatorStoreUi";
import {
    ActionLogEntry,
    AppStatus,
    AppStatusType,
    Cluster,
    ClusterNode,
    ClusterNodeStatus,
    ClusterNodeType,
    ClusterNodeVmStatus,
    ClusterResource,
    HelmApp,
    KubeStatus,
    VmStatus
} from "@/api/model";
import api from "@/api/api";


export const LOADING_INDICATOR_UNINSTALL_HELM_CHART = "LOADING_INDICATOR_UNINSTALL_HELM_CHART"
export const LOADING_INDICATOR_DELETE_HELM_CHART = "LOADING_INDICATOR_DELETE_HELM_CHART"
export const LOADING_INDICATOR_UPDATE_HELM_CHARTS_STATUS = "LOADING_INDICATOR_UPDATE_HELM_CHARTS_STATUS"

export const LOADING_INDICATOR_INSTALL_K8S_RESOURCE = "LOADING_INDICATOR_INSTALL_K8S_RESOURCE"
export const LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE = "LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE"
export const LOADING_INDICATOR_DELETE_K8S_RESOURCE = "LOADING_INDICATOR_DELETE_K8S_RESOURCE"


function vmIdAsc(a: ClusterNode, b: ClusterNode): number {
    return a.vmId - b.vmId;
}


export interface NodeWithStatus extends ClusterNode {
    vmStatus: VmStatus | null;
    kubeStatus: KubeStatus | null;

}

export interface HelmAppWithStatus extends HelmApp {
    status: AppStatusType | null
}

class ClusterManagementStore {
    clusterNodeVmStatuses: ClusterNodeVmStatus[] = [];
    clusterKubeStatuses: ClusterNodeStatus[] = [];
    helmAppsStatus: AppStatus[] = [];
    cluster: Cluster = {} as Cluster

    logs: ActionLogEntry[] = [];


    constructor() {
        makeAutoObservable(this)
    }

    get masterNodesWithStatus() {
        return (this.cluster.nodes || [])
            .filter(e => e.nodeType === ClusterNodeType.Master)
            .sort(vmIdAsc)
            .map(e => {
                const vmStatus = this.clusterNodeVmStatuses.find(s => s.vmid === e.vmId);
                const kubeStatus = this.clusterKubeStatuses.find(s => s.name === `${this.cluster.clusterName}-${e.name}`);
                return {
                    vmStatus: vmStatus?.status ?? null,
                    kubeStatus: kubeStatus?.status ?? null,
                    ...e
                } as NodeWithStatus;
            })
    }

    get workerNodesWithStatus() {
        return (this.cluster.nodes || [])
            .filter(e => e.nodeType == "worker")
            .sort(vmIdAsc)
            .map(e => {
                const vmStatus = this.clusterNodeVmStatuses.find(s => s.vmid === e.vmId);
                const kubeStatus = this.clusterKubeStatuses.find(s => s.name === `${this.cluster.clusterName}-${e.name}`);
                return {
                    vmStatus: vmStatus?.status ?? null,
                    kubeStatus: kubeStatus?.status ?? null,
                    ...e
                } as NodeWithStatus;

            })
    }

    get helmAppsWithStatus(): HelmAppWithStatus[] {
        return (this.cluster.helmApps || [])
            .map(e => {
                const status = this.helmAppsStatus.find(s => s.id == e.id)?.status ?? null;
                return {
                    status: status,
                    ...e
                } as HelmAppWithStatus
            })
    }

    get helmApps() {
        return this.cluster.helmApps || []
    }

    get k8SResources() {
        return this.cluster.clusterResources || []
    }

    async loadProject(clusterName: string) {
        const cluster = await apiCall(() => api.clusters.getCluster(clusterName));

        runInAction(() => {
            this.cluster = cluster;
            this.clusterNodeVmStatuses = [];
            this.clusterKubeStatuses = [];
        })
        await this.loadLogs(clusterName);
    }

    async loadLogs(clusterName: string) {
        const logs = await apiCall(() => api.clusters.logsForCluster(clusterName));

        runInAction(() => {
            this.logs = logs;
        })
    }

    async updateClusterNodeVmStatuses() {
        if (!this.cluster?.clusterName) {
            return
        }
        const clusterNodeVmStatuses = await apiCall(() => api.clusters.clusterNodeVmsStatus(this.cluster.clusterName))
        runInAction(() => {
            this.clusterNodeVmStatuses = clusterNodeVmStatuses;
        })
    }

    async updateClusterKubeStatuses() {
        if (!this.cluster?.clusterName) {
            return
        }
        const clusterNodeVmStatuses = await apiCall(() => api.clusters.clusterKubeStatus(this.cluster.clusterName))
        runInAction(() => {
            this.clusterKubeStatuses = clusterNodeVmStatuses;
        })
    }

    async updateNodesIfThereIsAnyLock() {
        if (!this.cluster?.clusterName) {
            return
        }
        const noLocks = !this.cluster.nodes
            .map(i => i.lock)
            .reduce((a, b) => a || b);

        if (noLocks) {
            return;
        }
        const nodes = await apiCall(() => api.clusters.getClusterNodes(this.cluster.clusterName))
        runInAction(() => {
            this.cluster.nodes = nodes;
        })

    }

    async updateAppsStatus() {
        let result = await apiCall(() => api.apps.appsStatus(this.cluster.clusterName), LOADING_INDICATOR_UPDATE_HELM_CHARTS_STATUS)
        runInAction(() => {
            this.helmAppsStatus = result
        })
    }

    findNode(id: number): ClusterNode | undefined {
        return this.cluster.nodes.find(e => e.vmId === id)
    }


    async addHelmChart(app: HelmApp): Promise<string> {
        app.id = await apiCall(() => api.apps.saveHelmApp(this.cluster.clusterName, app))
        runInAction(() => {
            if (!this.cluster.helmApps) {
                this.cluster.helmApps = []
            }
            this.cluster.helmApps.push(app);
            this.updateAppsStatus()
        })
        return app.id
    }

    async updateHelmChart(app: HelmApp) {
        runInAction(() => {
            const index = this.cluster.helmApps.findIndex((e: HelmApp) => e.id == app.id);
            this.cluster.helmApps[index] = app;
        })
        await apiCall(() => api.apps.updateHelmApp(this.cluster.clusterName, app))
    }

    async installHelmChartWithoutHandleGlobalErrorHandling(id: string) {
        try {
            await api.apps.installHelmApp(this.cluster.clusterName, id)
        } finally {
            await this.updateAppsStatus()
        }
    }

    async uninstallHelmChart(id: string) {
        await apiCall(() => api.apps.uninstallHelmApp(this.cluster.clusterName, id), LOADING_INDICATOR_UNINSTALL_HELM_CHART)
        await this.updateAppsStatus()
    }

    async deleteHelmChart(id: string) {
        await apiCall(() => api.apps.deleteHelmApp(this.cluster.clusterName, id), LOADING_INDICATOR_DELETE_HELM_CHART)
        runInAction(() => {
            this.cluster.helmApps = this.cluster.helmApps.filter(e => e.id != id)
        })
    }

    async addK8sResources(cks: ClusterResource): Promise<string> {
        cks.id = await apiCall(() => api.cluster_resources.saveClusterResource(this.cluster.clusterName, cks))
        runInAction(() => {
            if (!this.cluster.clusterResources) {
                this.cluster.clusterResources = []
            }
            this.cluster.clusterResources.push(cks);
        })
        return cks.id
    }

    async updateK8sResources(kr: ClusterResource) {
        runInAction(() => {
            const index = this.cluster.clusterResources.findIndex((e: ClusterResource) => e.id == kr.id);
            this.cluster.clusterResources[index] = kr;
        })
        await apiCall(() => api.cluster_resources.updateClusterResource(this.cluster.clusterName, kr))
    }

    async installK8sResourcesWithoutGlobalErrorHandling(id: string) {
        await wrapWithProcessingIndicator(
            LOADING_INDICATOR_INSTALL_K8S_RESOURCE,
            () => api.cluster_resources.installClusterResource(this.cluster.clusterName, id))
    }

    async uninstallK8sResourcesWithoutErrorHandling(id: string) {
        await wrapWithProcessingIndicator(
            LOADING_INDICATOR_UNINSTALL_K8S_RESOURCE,
            () => api.cluster_resources.uninstallClusterResource(this.cluster.clusterName, id))

    }

    async deleteK8sResources(id: string) {
        await apiCall(() => api.cluster_resources.deleteClusterResource(this.cluster.clusterName, id), LOADING_INDICATOR_DELETE_K8S_RESOURCE)
        runInAction(() => {
            this.cluster.clusterResources = this.cluster.clusterResources.filter((e: ClusterResource) => e.id !== id);
        })
    }

    async deleteNodeFromCluster(nodeName: string) {
        const deletedNode = await api.clusters.deleteNodeFromCluster(this.cluster.clusterName, nodeName);
        runInAction(() => {
            const index = this.cluster.nodes.findIndex((e: ClusterNode) => e.name == nodeName);
            this.cluster.nodes[index] = deletedNode;
        });
    }

    async changeNodeResources(nodeName: string, cores: number, memory: number) {
        await api.clusters.changeNodeResources(this.cluster.clusterName, nodeName, cores, memory);
    }

    async addNodeToCluster(node: ClusterNode) {
        const addedNode = await api.clusters.addNodeToCluster(this.cluster.clusterName, node);
        runInAction(() => {
            this.cluster.nodes.push(addedNode);
        });
    }
}

const clusterManagementStore = new ClusterManagementStore()
export default clusterManagementStore