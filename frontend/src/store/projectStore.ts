import { makeAutoObservable, runInAction } from "mobx";
import { k4p, project } from "@wails/models";
import { LoadProject, SaveProject } from "@wails/project/Service";
import { LogDebug, LogError } from "@wails-runtime/runtime";
import { ClearTaskLog } from "@wails/tasklog/Service";
import { CreateCluster, SetupEnvironmentOnProxmox } from "@wails/provisioner/Service";
import taskLogStore from "@/store/taskLogStore";

export interface FeatureDefinition {
    name: string;
    panelName: string
    title: string;
}

export const ADDON_DEFINITIONS: FeatureDefinition[] = [
    {
        name: "metallb",
        panelName: "MetalLbProperties",
        title: "MetalLB"
    },
    {
        name: "metrics-server",
        panelName: "MetricsServerProperties",
        title: "Metrics Server"
    },
    {
        name: "ingress",
        panelName: "IngressProperties",
        title: "Ingress",
    },
    {
        name: "openebs",
        panelName: "OpenEbsProperties",
        title: "OpenEBS"
    }
]

export const HELM_APP_DEFINITIONS: FeatureDefinition[] = [
    {
        name: "argocd",
        panelName: "ArgoCdProperties",
        title: "Argo CD",
    },
    {
        name: "portainer",
        panelName: "PortainerProperties",
        title: "Portainer"
    },
];

const initialProjectData = {
    kubeConfig: "",
    sshKey: {},
    cluster: {
        nodeUsername: "",
        nodePassword: "",
        nodeDiskSize: 0,
        network: {
            gateway: "",
            subnetMask: 0,
            bridge: "",
            dnsServer: "",
        },
        microK8SAddons: [] as k4p.MicroK8sAddon[],
        helmApps: [] as k4p.HelmApp[],
        customHelmApps: [] as k4p.HelmApp[],
        customK8SResources: [] as k4p.CustomK8sResource[],
        nodes: [] as k4p.KubernetesNode[],
    } as k4p.Cluster
} as project.ProjectData;

function vmIdAsc(a: k4p.KubernetesNode, b: k4p.KubernetesNode): number {
    return a.vmid - b.vmid;
}

function vmIdDesc(a: k4p.KubernetesNode, b: k4p.KubernetesNode): number {
    return b.vmid - a.vmid;
}

export interface GeneralSettingsModel {
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

class ProjectStore {
    projectData: project.ProjectData = initialProjectData
    defaultMasterNode: k4p.KubernetesNode = {} as k4p.KubernetesNode
    provisioningInProgress: boolean = false
    provisioningFinishedSuccessfully = true

    constructor() {
        makeAutoObservable(this);
    }

    async provisionCluster(pr: k4p.ProvisionRequest) {
        await SaveProject(this.projectData)
        runInAction(() => {
            this.provisioningInProgress = true
        })

        const readTaskLogInterval = setInterval(() => {
                taskLogStore.loadTaskLog().catch(LogError)
            },
            2000);

        try {
            await ClearTaskLog();
            await SetupEnvironmentOnProxmox();
            await CreateCluster(pr);
            LogDebug("Cluster created successfully");
        } catch (err: any) {
            LogError(err)
            runInAction(() => {
                this.provisioningFinishedSuccessfully = false
            })
        } finally {
            clearInterval(readTaskLogInterval);
            runInAction(() => {
                this.provisioningInProgress = false
            })
            await taskLogStore.loadTaskLog()
        }
    }

    saveProject() {
        SaveProject(this.projectData)
            .then(() => {
                LogDebug("Project has been saved")
            })
            .catch(LogError)
    }

    enableHelmApp(app: k4p.HelmApp) {
        this.projectData.cluster.helmApps.push(app);
        this.saveProject()
    }

    disableHelmApp(releaseName: string) {
        this.projectData.cluster.helmApps = this.projectData.cluster.helmApps.filter((e: k4p.HelmApp) => e.releaseName !== releaseName);
        this.saveProject()
    }

    addCustomHelmApp(app: k4p.HelmApp) {
        this.projectData.cluster.customHelmApps.push(app);
        this.saveProject()
    }


    updateGeneralSettings(data: GeneralSettingsModel) {
        this.projectData.cluster.nodeUsername = data.nodeUsername
        this.projectData.cluster.nodePassword = data.nodePassword
        this.projectData.cluster.nodeDiskSize = data.nodeDiskSize
        this.projectData.cluster.network.bridge = data.network.bridge
        this.projectData.cluster.network.gateway = data.network.gateway
        this.projectData.cluster.network.dnsServer = data.network.dnsServer
        this.projectData.cluster.network.subnetMask = data.network.subnetMask
        LogDebug("Cluster settings has been updated")
        this.saveProject()
    }

    addNode(nodeType: "master" | "worker") {
        let nodes = this.projectData.cluster.nodes
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
                nodeBaseOnAnotherType.name = nodeBaseOnAnotherType
                    .name
                    .substring(0, nodeBaseOnAnotherType.name.indexOf("-"))
                    .concat("-", nodeType, "-1");

                nodeBaseOnAnotherType.nodeType = nodeType;
                nodes.push(nodeBaseOnAnotherType);
                return
            }

        }
        nodes.push(createNextNodeDefinition(latestNodeWithNodeType));
        this.projectData.cluster.nodes = nodes.sort(vmIdAsc)
        this.saveProject()
    }


    updateNode(id: number, newNode: k4p.KubernetesNode) {
        const idx = this.projectData.cluster.nodes.findIndex((e: k4p.KubernetesNode) => e.vmid === id);
        this.projectData.cluster.nodes[idx] = {
            ...newNode
        }
        this.saveProject()
    }

    deleteNode(vmId: number) {
        this.projectData.cluster.nodes = this.projectData.cluster.nodes.filter((e: k4p.KubernetesNode) => e.vmid !== vmId);
        this.saveProject()
    }


    enableMicroK8SAddon(name: string, args = "", additionalK8SResources: string[] = []) {
        this.projectData.cluster.microK8SAddons.push({
            name: name,
            args: args,
            additionalK8SResources: additionalK8SResources
        } as k4p.MicroK8sAddon);
        this.saveProject()
    }

    updateMicroK8SAddonArgs(name: string, args: string) {
        const idx = this.projectData.cluster.microK8SAddons.findIndex((e: k4p.MicroK8sAddon) => e.name === name);
        this.projectData.cluster.microK8SAddons[idx].args = args
        this.saveProject()
    }

    disableMicroK8SAddon(name: string) {
        this.projectData.cluster.microK8SAddons = this.projectData.cluster.microK8SAddons.filter((e: k4p.MicroK8sAddon) => e.name !== name);
        this.saveProject()
    }

    updateMicroK8SAddonAdditionalK8SResources(name: string, kod: string[]) {
        const idx = this.projectData.cluster.microK8SAddons.findIndex((e: k4p.MicroK8sAddon) => e.name === name);
        this.projectData.cluster.microK8SAddons[idx].additionalK8SResources = kod
        this.saveProject()
    }


    deleteCustomHelmApp(releaseName: string) {
        this.projectData.cluster.customHelmApps = this.projectData.cluster.customHelmApps.filter((e: k4p.HelmApp) => e.releaseName !== releaseName);
        this.saveProject()
    }

    updateCustomHelmApp(releaseName: string, newApp: k4p.HelmApp) {
        const index = this.projectData.cluster.customHelmApps.findIndex((e: k4p.HelmApp) => e.releaseName == releaseName);
        this.projectData.cluster.customHelmApps[index] = newApp;
        this.saveProject()
    }

    addCustomK8SResources(cks: k4p.CustomK8sResource) {
        this.projectData.cluster.customK8SResources.push(cks);
        this.saveProject()
    }

    updateCustomK8SResources(oldName: string, newCkr: k4p.CustomK8sResource) {
        const index = this.projectData.cluster.customK8SResources.findIndex((e: k4p.CustomK8sResource) => e.name == oldName);
        this.projectData.cluster.customK8SResources[index] = newCkr;
        this.saveProject()
    }

    deleteCustomK8SResources(name: string) {
        this.projectData.cluster.customK8SResources = this.projectData.cluster.customK8SResources.filter((e: k4p.CustomK8sResource) => e.name !== name);
        this.saveProject()
    }

    async loadProject() {
        const project = await LoadProject();

        const defaultMasterNode = {
            ...project.cluster.nodes.filter((e: k4p.KubernetesNode) => e.nodeType == "master").sort((a, b) => a.vmid - b.vmid)[0] || {
                vmid: 999,
                cores: 2,
                memory: 2048,
                name: "microk8s-master-1",
                storagePool: "",
                ipAddress: "",
                nodeType: "master"
            }
        }
        runInAction(() => {
            this.projectData = project
            this.defaultMasterNode = defaultMasterNode
        })
    }

    findNode(id: number): k4p.KubernetesNode | undefined {
        return this.projectData.cluster.nodes.find(e => e.vmid === id)
    }

    get generalSettings(): GeneralSettingsModel {
        return {
            nodeUsername: this.projectData.cluster.nodeUsername,
            nodePassword: this.projectData.cluster.nodePassword,
            nodeDiskSize: this.projectData.cluster.nodeDiskSize,
            network: {
                bridge: this.projectData.cluster.network.bridge,
                dnsServer: this.projectData.cluster.network.dnsServer,
                gateway: this.projectData.cluster.network.gateway,
                subnetMask: this.projectData.cluster.network.subnetMask
            } as k4p.Network
        } as GeneralSettingsModel
    }


    get enabledMicroK8sAddons(): FeatureDefinition[] {
        return ADDON_DEFINITIONS.filter(e => !!this.projectData.cluster.microK8SAddons.find(i => i.name === e.name))
    }

    get availableMicroK8sAddons(): FeatureDefinition[] {
        return ADDON_DEFINITIONS.filter(e => !this.projectData.cluster.microK8SAddons.find(i => i.name === e.name))
    }

    get enabledHelmApps(): FeatureDefinition[] {
        return HELM_APP_DEFINITIONS.filter(e => !!this.projectData.cluster.helmApps.find(i => i.releaseName === e.name));
    }

    get availableHelmApps(): FeatureDefinition[] {
        return HELM_APP_DEFINITIONS.filter(e => !this.projectData.cluster.helmApps.find(i => i.releaseName === e.name));
    }

    get masterNodes() {
        return this.projectData.cluster.nodes.filter(e => e.nodeType == "master").sort(vmIdAsc)
    }

    get workerNodes() {
        return this.projectData.cluster.nodes.filter(e => e.nodeType == "worker").sort(vmIdAsc)
    }

    get customHelmApps() {
        return this.projectData.cluster.customHelmApps;
    }

    get customK8SResources(): k4p.CustomK8sResource[] {
        return this.projectData.cluster.customK8SResources;
    }

    get microK8SAddons() {
        return this.projectData.cluster.microK8SAddons
    }

    get helmApps() {
        return this.projectData.cluster.helmApps
    }
}

const projectStore = new ProjectStore()

export default projectStore;