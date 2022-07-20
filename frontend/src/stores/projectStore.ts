import {defineStore} from 'pinia'
import {repackWailsPromise} from "@/utils/promise";
import type {k4p, project} from "@wails/models";
import {LoadProject, SaveProject} from "@wails/project/Service";

const Master = "master";
const Worker = "worker";

export enum TaskStatus {
    NOT_STARTED = "", STARTED = "started", FINISHED = "finished", ERROR = "error"
}

export interface FeatureDefinition {
    name: string;
    title: string;
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
    {
        name: "dns",
        title: "Core DNS",
    },
    {
        name: "ingress",
        title: "Ingress controller",
    },
    {
        name: "metallb",
        title: "MetalLB load balancer"
    },
    {
        name: "openebs",
        title: "OpenEBS storage"
    }
]

interface State {
    project: project.ProjectData
    defaultMasterNode: k4p.KubernetesNode
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

function vmIdAsc(a: k4p.KubernetesNode, b: k4p.KubernetesNode): number {
    return a.vmid - b.vmid;
}

function vmIdDesc(a: k4p.KubernetesNode, b: k4p.KubernetesNode): number {
    return b.vmid - a.vmid;
}

export const useProjectStore = defineStore({
    id: 'projectStore',
    state: (): State => ({
        project: {
            kubeConfig: "",
            sshKey: [],
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
                nodes: [] as k4p.KubernetesNode[],
                features: [] as k4p.Feature[]
            } as k4p.Cluster
        } as project.ProjectData,
        defaultMasterNode: {} as k4p.KubernetesNode
    }),
    getters: {
        clusterIsValid: (state: State): boolean => {
            return state.project.cluster.nodes
                .filter((e: k4p.KubernetesNode) => e.nodeType === Master)
                .length > 0;
        },
        masterNodes: (state: State): k4p.KubernetesNode[] => {
            return state.project.cluster.nodes
                .filter((e: k4p.KubernetesNode) => e.nodeType == Master)
                .sort(vmIdAsc)
        },
        workerNodes: (state: State): k4p.KubernetesNode[] => {
            return state.project.cluster.nodes
                .filter((e: k4p.KubernetesNode) => e.nodeType == Worker)
                .sort(vmIdAsc)
        },
        features: (state: State): k4p.Feature[] => {
            return state.project.cluster.features;
        }
    },
    actions: {
        loadProject() {
            repackWailsPromise(LoadProject())
                .then(response => {
                    this.project = response;
                    this.defaultMasterNode = {
                        ...this.project.cluster.nodes.filter((e: k4p.KubernetesNode) => e.nodeType == Master).sort(vmIdAsc)[0] || {
                            vmid: 999,
                            cores: 2,
                            memory: 2048,
                            name: "microk8s-master-1",
                            storagePool: "",
                            ipAddress: "",
                            nodeType: Master
                        }
                    }

                })
                .catch(console.error)
        },
        saveProject() {
            repackWailsPromise(SaveProject(this.project))
                .then(() => {
                    console.log("project was saved")
                })
                .catch(console.error)
        },
        addNode(nodeType: string) {
            const latestNodeWithNodeType: k4p.KubernetesNode | null = this.project.cluster
                    .nodes
                    .sort(vmIdDesc)
                    .find((e: k4p.KubernetesNode) => e.nodeType === nodeType)
                || null;

            if (latestNodeWithNodeType == null) {
                const anyNode: k4p.KubernetesNode | null =
                    this.project.cluster.nodes.length > 0
                        ? this.project.cluster.nodes.sort(vmIdAsc)[0]
                        : null;
                if (anyNode == null) {
                    this.project.cluster.nodes.push({...this.defaultMasterNode})
                    return
                } else {
                    const nodeBaseOnAnotherType = createNextNodeDefinition(
                        anyNode,
                        nodeType == Worker
                            ? this.project.cluster.nodes.length > 10 ? this.project.cluster.nodes.length : 10
                            : -10);
                    nodeBaseOnAnotherType.name = nodeBaseOnAnotherType
                        .name
                        .substring(0, nodeBaseOnAnotherType.name.indexOf("-"))
                        .concat("-", nodeType, "-1");

                    nodeBaseOnAnotherType.nodeType = nodeType;
                    this.project.cluster.nodes.push(nodeBaseOnAnotherType);
                    return
                }

            }
            this.project.cluster.nodes.push(createNextNodeDefinition(latestNodeWithNodeType));

        },
        updateNode(newNode: k4p.KubernetesNode, oldNode: k4p.KubernetesNode) {
            const idx = this.project.cluster.nodes.findIndex((e: k4p.KubernetesNode) => e.vmid === oldNode.vmid);
            this.project.cluster.nodes[idx] = {
                ...newNode
            }
        },
        deleteNode(vmId: number) {
            this.project.cluster.nodes = this.project.cluster.nodes.filter((e: k4p.KubernetesNode) => e.vmid !== vmId);
        },
        enableFeature(name: string, args = "", kubernetesObjectDefinition = "") {
            this.project.cluster.features.push({
                name: name,
                args: args,
                kubernetesObjectDefinition: kubernetesObjectDefinition
            } as k4p.Feature);
        },
        updateFeatureArgs(name: string, args: string) {
            const idx = this.project.cluster.features.findIndex((e: k4p.Feature) => e.name === name);
            this.project.cluster.features[idx].args = args
        },
        updateFeatureKubernetesObjectDefinition(name: string, kod: string) {
            const idx = this.project.cluster.features.findIndex((e: k4p.Feature) => e.name === name);
            this.project.cluster.features[idx].kubernetesObjectDefinition = kod
        },
        disableFeature(name: string) {
            this.project.cluster.features = this.project.cluster.features.filter((e: k4p.Feature) => e.name !== name);
        }
    }
})
