import { makeAutoObservable, runInAction } from "mobx";
import { k4p, management } from "@wails/models";
import { GetNodesStatus } from "@wails/management/Service";
import { LogDebug } from "@wails-runtime/runtime";
import { LoadCluster } from "@wails/database/Service";
import { apiCall } from "@/utils/api";


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

class ClusterManagementStore {
    nodesStatus: management.NodeStatus[] = [];
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

    findNode(id: number): k4p.KubernetesNode | undefined {
        return this.cluster.nodes.find(e => e.vmid === id)
    }
}

const clusterManagementStore = new ClusterManagementStore()
export default clusterManagementStore