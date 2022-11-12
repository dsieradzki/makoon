export namespace database {
	
	export class Metadata {
	    // Go type: time.Time
	    lastUpdate: any;
	    schemaVersion: number;
	
	    static createFrom(source: any = {}) {
	        return new Metadata(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.lastUpdate = this.convertValues(source["lastUpdate"], null);
	        this.schemaVersion = source["schemaVersion"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DatabaseData {
	    metadata: Metadata;
	    clusters: k4p.Cluster[];
	
	    static createFrom(source: any = {}) {
	        return new DatabaseData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.metadata = this.convertValues(source["metadata"], Metadata);
	        this.clusters = this.convertValues(source["clusters"], k4p.Cluster);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace k4p {
	
	export class Network {
	    gateway: string;
	    subnetMask: number;
	    dnsServer: string;
	    bridge: string;
	
	    static createFrom(source: any = {}) {
	        return new Network(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.gateway = source["gateway"];
	        this.subnetMask = source["subnetMask"];
	        this.dnsServer = source["dnsServer"];
	        this.bridge = source["bridge"];
	    }
	}
	export class KubernetesNode {
	    name: string;
	    vmid: number;
	    cores: number;
	    memory: number;
	    ipAddress: string;
	    storagePool: string;
	    nodeType: string;
	
	    static createFrom(source: any = {}) {
	        return new KubernetesNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.vmid = source["vmid"];
	        this.cores = source["cores"];
	        this.memory = source["memory"];
	        this.ipAddress = source["ipAddress"];
	        this.storagePool = source["storagePool"];
	        this.nodeType = source["nodeType"];
	    }
	}
	export class CustomK8sResource {
	    name: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new CustomK8sResource(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.content = source["content"];
	    }
	}
	export class HelmApp {
	    chartName: string;
	    repository: string;
	    releaseName: string;
	    namespace: string;
	    valueFileContent: string;
	
	    static createFrom(source: any = {}) {
	        return new HelmApp(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chartName = source["chartName"];
	        this.repository = source["repository"];
	        this.releaseName = source["releaseName"];
	        this.namespace = source["namespace"];
	        this.valueFileContent = source["valueFileContent"];
	    }
	}
	export class Cluster {
	    clusterName: string;
	    kubeConfig: string;
	    sshKey: ssh.RsaKeyPair;
	    nodeUsername: string;
	    nodePassword: string;
	    customHelmApps: HelmApp[];
	    customK8SResources: CustomK8sResource[];
	    nodeDiskSize: number;
	    nodes: KubernetesNode[];
	    network: Network;
	
	    static createFrom(source: any = {}) {
	        return new Cluster(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.clusterName = source["clusterName"];
	        this.kubeConfig = source["kubeConfig"];
	        this.sshKey = this.convertValues(source["sshKey"], ssh.RsaKeyPair);
	        this.nodeUsername = source["nodeUsername"];
	        this.nodePassword = source["nodePassword"];
	        this.customHelmApps = this.convertValues(source["customHelmApps"], HelmApp);
	        this.customK8SResources = this.convertValues(source["customK8SResources"], CustomK8sResource);
	        this.nodeDiskSize = source["nodeDiskSize"];
	        this.nodes = this.convertValues(source["nodes"], KubernetesNode);
	        this.network = this.convertValues(source["network"], Network);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	export class ProvisionStage {
	    createVirtualMachines: boolean;
	    setupVirtualMachines: boolean;
	    installKubernetes: boolean;
	    joinNodesToCluster: boolean;
	    installCustomHelmApps: boolean;
	    installCustomK8SResources: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProvisionStage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.createVirtualMachines = source["createVirtualMachines"];
	        this.setupVirtualMachines = source["setupVirtualMachines"];
	        this.installKubernetes = source["installKubernetes"];
	        this.joinNodesToCluster = source["joinNodesToCluster"];
	        this.installCustomHelmApps = source["installCustomHelmApps"];
	        this.installCustomK8SResources = source["installCustomK8SResources"];
	    }
	}
	export class ProvisionRequest {
	    stages: ProvisionStage;
	    cluster: Cluster;
	
	    static createFrom(source: any = {}) {
	        return new ProvisionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.stages = this.convertValues(source["stages"], ProvisionStage);
	        this.cluster = this.convertValues(source["cluster"], Cluster);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace management {
	
	export class ClusterHeader {
	    name: string;
	    nodesCount: number;
	    coresSum: number;
	    memorySum: number;
	    diskSizeSum: number;
	
	    static createFrom(source: any = {}) {
	        return new ClusterHeader(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.nodesCount = source["nodesCount"];
	        this.coresSum = source["coresSum"];
	        this.memorySum = source["memorySum"];
	        this.diskSizeSum = source["diskSizeSum"];
	    }
	}
	export class NodeStatus {
	    vmid: number;
	    vmStatus: string;
	    k8SStatus: string;
	
	    static createFrom(source: any = {}) {
	        return new NodeStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.vmid = source["vmid"];
	        this.vmStatus = source["vmStatus"];
	        this.k8SStatus = source["k8SStatus"];
	    }
	}

}

export namespace ssh {
	
	export class RsaKeyPair {
	    privateKey: number[];
	    publicKey: number[];
	
	    static createFrom(source: any = {}) {
	        return new RsaKeyPair(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.privateKey = source["privateKey"];
	        this.publicKey = source["publicKey"];
	    }
	}

}

export namespace tasklog {
	
	export class Task {
	    correlationId: number[];
	    // Go type: time.Time
	    createTime: any;
	    duration: number;
	    name: string;
	    details: string[];
	    state: string;
	
	    static createFrom(source: any = {}) {
	        return new Task(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.correlationId = source["correlationId"];
	        this.createTime = this.convertValues(source["createTime"], null);
	        this.duration = source["duration"];
	        this.name = source["name"];
	        this.details = source["details"];
	        this.state = source["state"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

