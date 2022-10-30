import { makeAutoObservable, runInAction } from "mobx";
import { LogDebug, LogError } from "@wails-runtime/runtime";
import { ClearTaskLog } from "@wails/tasklog/Service";
import { CreateCluster, SetupEnvironmentOnProxmox } from "@wails/provisioner/Service";
import taskLogStore from "@/store/taskLogStore";
import { k4p } from "@wails/models";
import { GenerateDefaultCluster } from "@wails/provisioner/Generator";
import { apiCall } from "@/utils/api";

export const PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER = "PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER"


const initialProjectData = {
    kubeConfig: "",
    sshKey: {},
    nodeUsername: "",
    nodePassword: "",
    nodeDiskSize: 0,
    network: {
        gateway: "",
        subnetMask: 0,
        bridge: "",
        dnsServer: "",
    },
    customHelmApps: [] as k4p.HelmApp[],
    customK8SResources: [] as k4p.CustomK8sResource[],
    nodes: [] as k4p.KubernetesNode[],
} as k4p.Cluster

function vmIdAsc(a: k4p.KubernetesNode, b: k4p.KubernetesNode): number {
    return a.vmid - b.vmid;
}

function vmIdDesc(a: k4p.KubernetesNode, b: k4p.KubernetesNode): number {
    return b.vmid - a.vmid;
}

export interface GeneralSettingsModel {
    clusterName: string;
    nodeUsername: string;
    nodePassword: string;
    network: k4p.Network;
    nodeDiskSize: number;
}

function createNextNodeDefinition(node: k4p.KubernetesNode, step = 1): k4p.KubernetesNode {
    const namePrefix = node.name.substring(0, node.name.lastIndexOf("-"))
    const nameNumber = node.name.substring(node.name.lastIndexOf("-") + 1)

    const lastOctetIdx = node.ipAddress.lastIndexOf(".");
    const firstOctets = node.ipAddress.substring(0, lastOctetIdx + 1);
    const lastOctet = node.ipAddress.substring(lastOctetIdx + 1);
    return {
        vmid: node.vmid + step,
        storagePool: node.storagePool,
        cores: node.cores,
        memory: node.memory,
        nodeType: node.nodeType,
        name: namePrefix + "-" + (Number(nameNumber) + step).toString(),
        ipAddress: firstOctets + (Number(lastOctet) + step).toString()
    }
}


export class ClusterWizardStore {
    cluster: k4p.Cluster = initialProjectData
    defaultMasterNode: k4p.KubernetesNode = {} as k4p.KubernetesNode
    provisioningInProgress: boolean = false
    provisioningFinishedSuccessfully = true

    constructor() {
        makeAutoObservable(this);
    }

    async provisionCluster(pr: k4p.ProvisionRequest) {
        runInAction(() => {
            this.provisioningInProgress = true
        })

        const readTaskLogInterval = setInterval(() => {
                taskLogStore.loadTaskLog().catch(LogError)
            },
            2000);

        try {
            await apiCall(() => ClearTaskLog())
            await apiCall(() => SetupEnvironmentOnProxmox())
            await apiCall(() => CreateCluster(pr))
            LogDebug("Cluster created successfully");
        } catch (_) {
            LogError("Cannot create cluster")
            runInAction(() => {
                this.provisioningFinishedSuccessfully = false
            })
        } finally {
            clearInterval(readTaskLogInterval);
            runInAction(() => {
                this.provisioningInProgress = false
            })
            await apiCall(() => taskLogStore.loadTaskLog())
        }
    }

    addCustomHelmApp(app: k4p.HelmApp) {
        this.cluster.customHelmApps.push(app);
    }


    updateGeneralSettings(data: GeneralSettingsModel) {
        this.cluster.clusterName = data.clusterName
        this.cluster.nodeUsername = data.nodeUsername
        this.cluster.nodePassword = data.nodePassword
        this.cluster.nodeDiskSize = data.nodeDiskSize
        this.cluster.network.bridge = data.network.bridge
        this.cluster.network.gateway = data.network.gateway
        this.cluster.network.dnsServer = data.network.dnsServer
        this.cluster.network.subnetMask = data.network.subnetMask
        LogDebug("Cluster settings has been updated")
    }

    addNode(nodeType: "master" | "worker") {
        let nodes = this.cluster.nodes
        const defaultMasterNode = this.defaultMasterNode
        const latestNodeWithNodeType: k4p.KubernetesNode | null = nodes
                .sort(vmIdDesc)
                .find((e: k4p.KubernetesNode) => e.nodeType === nodeType)
            || null;

        if (latestNodeWithNodeType == null) {
            const anyNode: k4p.KubernetesNode | null =
                nodes.length > 0
                    ? nodes.sort(vmIdAsc)[0]
                    : null;
            if (anyNode == null) {
                nodes.push({...defaultMasterNode})
                return
            } else {
                const nodeBaseOnAnotherType = createNextNodeDefinition(
                    anyNode,
                    nodeType == "worker"
                        ? nodes.length > 5 ? nodes.length : 5
                        : -5);
                nodeBaseOnAnotherType.name = nodeType + "-1"

                nodeBaseOnAnotherType.nodeType = nodeType;
                nodes.push(nodeBaseOnAnotherType);
                return
            }

        }
        nodes.push(createNextNodeDefinition(latestNodeWithNodeType));
        this.cluster.nodes = nodes.sort(vmIdAsc)
    }


    updateNode(id: number, newNode: k4p.KubernetesNode) {
        const idx = this.cluster.nodes.findIndex((e: k4p.KubernetesNode) => e.vmid === id);
        this.cluster.nodes[idx] = {
            ...newNode
        }
    }

    deleteNode(vmId: number) {
        this.cluster.nodes = this.cluster.nodes.filter((e: k4p.KubernetesNode) => e.vmid !== vmId);
    }

    deleteCustomHelmApp(releaseName: string) {
        this.cluster.customHelmApps = this.cluster.customHelmApps.filter((e: k4p.HelmApp) => e.releaseName !== releaseName);
    }

    updateCustomHelmApp(releaseName: string, newApp: k4p.HelmApp) {
        const index = this.cluster.customHelmApps.findIndex((e: k4p.HelmApp) => e.releaseName == releaseName);
        this.cluster.customHelmApps[index] = newApp;
    }

    addCustomK8SResources(cks: k4p.CustomK8sResource) {
        this.cluster.customK8SResources.push(cks);
    }

    updateCustomK8SResources(oldName: string, newCkr: k4p.CustomK8sResource) {
        const index = this.cluster.customK8SResources.findIndex((e: k4p.CustomK8sResource) => e.name == oldName);
        this.cluster.customK8SResources[index] = newCkr;
    }

    deleteCustomK8SResources(name: string) {
        this.cluster.customK8SResources = this.cluster.customK8SResources.filter((e: k4p.CustomK8sResource) => e.name !== name);
    }


    async generateDefaultCluster() {
        LogDebug("Start generating default project")
        const cluster = await apiCall(() => GenerateDefaultCluster(), PROCESSING_INDICATOR_GENERATE_DEFAULT_CLUSTER)

        const defaultMasterNode = {
            ...cluster.nodes.filter((e: k4p.KubernetesNode) => e.nodeType == "master").sort((a, b) => a.vmid - b.vmid)[0] || {
                vmid: 999,
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

    findNode(id: number): k4p.KubernetesNode | undefined {
        return this.cluster.nodes.find(e => e.vmid === id)
    }

    get generalSettings(): GeneralSettingsModel {
        return {
            clusterName: this.cluster.clusterName || "",
            nodeUsername: this.cluster.nodeUsername,
            nodePassword: this.cluster.nodePassword,
            nodeDiskSize: this.cluster.nodeDiskSize,
            network: {
                bridge: this.cluster.network.bridge,
                dnsServer: this.cluster.network.dnsServer,
                gateway: this.cluster.network.gateway,
                subnetMask: this.cluster.network.subnetMask
            } as k4p.Network
        } as GeneralSettingsModel
    }

    get masterNodes() {
        return this.cluster.nodes.filter(e => e.nodeType == "master").sort(vmIdAsc) || []
    }


    get workerNodes() {
        return this.cluster.nodes.filter(e => e.nodeType == "worker").sort(vmIdAsc) || []
    }

    get customHelmApps() {
        return this.cluster.customHelmApps;
    }

    get customK8SResources(): k4p.CustomK8sResource[] {
        return this.cluster.customK8SResources;
    }
}