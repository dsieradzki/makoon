import {makeAutoObservable, runInAction} from "mobx";
import {apiCall} from "@/utils/api";
import {
    ClusterRequest,
    ClusterResource,
    HelmApp,
    Network,
    ClusterNode,
    ClusterNodeType,
} from "@/api/model";
import api from "@/api/api";
import {generateNode} from "@/utils/nodes";

export const PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER = "PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER"


const initialProjectData = {
    clusterVersion: "",
    osImage: "",
    osImageStorage: "",
    kubeVersion: "",
    node: "",
    clusterName: "",
    diskSize: 0,
    clusterConfig: "",
    sshKey: {
        publicKey: "",
        privateKey: ""
    },
    nodeUsername: "",
    nodePassword: "",
    nodeDiskSize: 0,
    network: {
        gateway: "",
        subnetMask: 0,
        bridge: "",
        dns: "",
    },
    helmApps: [] as HelmApp[],
    clusterResources: [] as ClusterResource[],
    nodes: [] as ClusterNode[],
} as ClusterRequest

function vmIdAsc(a: ClusterNode, b: ClusterNode): number {
    return a.vmId - b.vmId;
}

function vmIdDesc(a: ClusterNode, b: ClusterNode): number {
    return b.vmId - a.vmId;
}

export interface SettingsModel {
    node: string;
    osImage: string,
    osImageStorage: string,
    kubeVersion: string;
}

export interface ClusterSettingsModel {
    clusterName: string;
    nodeUsername: string;
    nodePassword: string;
    network: Network;
    diskSize: number;
}

export class ClusterCreatorStore {
    cluster: ClusterRequest = initialProjectData
    defaultMasterNode: ClusterNode = {} as ClusterNode

    constructor() {
        console.log("creator store created")
        makeAutoObservable(this);
    }

    async provisionCluster(pr: ClusterRequest) {
        await apiCall(() => api.clusters.createCluster(pr))

    }

    addHelmApp(app: HelmApp) {
        this.cluster.helmApps.push(app);
    }


    updateClusterSettings(data: ClusterSettingsModel) {
        this.cluster.clusterName = data.clusterName
        this.cluster.nodeUsername = data.nodeUsername
        this.cluster.nodePassword = data.nodePassword
        this.cluster.diskSize = data.diskSize
        this.cluster.network.bridge = data.network.bridge
        this.cluster.network.gateway = data.network.gateway
        this.cluster.network.dns = data.network.dns
        this.cluster.network.subnetMask = data.network.subnetMask
    }

    updateSettings(data: SettingsModel) {
        this.cluster.node = data.node;
        this.cluster.osImage = data.osImage;
        this.cluster.osImageStorage = data.osImageStorage;
        this.cluster.kubeVersion = data.kubeVersion;
    }

    addNode(nodeType: ClusterNodeType) {
        this.cluster.nodes.push(generateNode(this.cluster.nodes, nodeType, this.defaultMasterNode));
    }

    updateNode(id: number, newNode: ClusterNode) {
        const idx = this.cluster.nodes.findIndex((e: ClusterNode) => e.vmId === id);
        this.cluster.nodes[idx] = {
            ...newNode
        }
    }

    deleteNode(vmId: number) {
        this.cluster.nodes = this.cluster.nodes.filter((e: ClusterNode) => e.vmId !== vmId);
    }

    deleteHelmApp(releaseName: string) {
        this.cluster.helmApps = this.cluster.helmApps.filter((e: HelmApp) => e.releaseName !== releaseName);
    }

    updateHelmApp(releaseName: string, newApp: HelmApp) {
        const index = this.cluster.helmApps.findIndex((e: HelmApp) => e.releaseName == releaseName);
        this.cluster.helmApps[index] = newApp;
    }

    addCustomK8SResources(cks: ClusterResource) {
        this.cluster.clusterResources.push(cks);
    }

    updateCustomK8SResources(oldName: string, newCkr: ClusterResource) {
        const index = this.cluster.clusterResources.findIndex((e: ClusterResource) => e.name == oldName);
        this.cluster.clusterResources[index] = newCkr;
    }

    deleteCustomK8SResources(name: string) {
        this.cluster.clusterResources = this.cluster.clusterResources.filter((e: ClusterResource) => e.name !== name);
    }


    async generateDefaultCluster() {
        const cluster = await apiCall(() => api.clusters.generateDefaultClusterConfiguration(), PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER)

        const defaultMasterNode = {
            ...cluster.nodes.filter((e: ClusterNode) => e.nodeType == "master").sort((a, b) => a.vmId - b.vmId)[0] || {
                vmId: 999,
                cores: 2,
                memory: 2048,
                name: "master-1",
                storagePool: "",
                ipAddress: "",
                nodeType: "master"
            }
        }
        runInAction(() => {
            this.cluster = cluster
            this.defaultMasterNode = defaultMasterNode
        })
    }

    findNode(id: number): ClusterNode | undefined {
        return this.cluster.nodes.find(e => e.vmId === id)
    }

    get clusterSettings(): ClusterSettingsModel {
        return {
            clusterName: this.cluster.clusterName || "",
            nodeUsername: this.cluster.nodeUsername,
            nodePassword: this.cluster.nodePassword,
            diskSize: this.cluster.diskSize,
            network: {
                bridge: this.cluster.network.bridge,
                dns: this.cluster.network.dns,
                gateway: this.cluster.network.gateway,
                subnetMask: this.cluster.network.subnetMask
            } as Network
        } as ClusterSettingsModel
    }

    get settings(): SettingsModel {
        return {
            node: this.cluster.node,
            osImage: this.cluster.osImage,
            osImageStorage: this.cluster.osImageStorage,
            kubeVersion: this.cluster.kubeVersion
        }
    }

    get masterNodes() {
        return this.cluster.nodes.filter(e => e.nodeType == "master").sort(vmIdAsc) || []
    }


    get workerNodes() {
        return this.cluster.nodes.filter(e => e.nodeType == "worker").sort(vmIdAsc) || []
    }

    get helmApps() {
        return this.cluster.helmApps || [];
    }

    get k8SResources(): ClusterResource[] {
        return this.cluster.clusterResources || [];
    }
}