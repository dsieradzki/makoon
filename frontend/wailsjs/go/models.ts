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

export namespace proxmox {
	
	export class Network {
	    iface: string;
	    address: string;
	    gateway: string;
	    cidr: string;
	
	    static createFrom(source: any = {}) {
	        return new Network(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.iface = source["iface"];
	        this.address = source["address"];
	        this.gateway = source["gateway"];
	        this.cidr = source["cidr"];
	    }
	}

}

export namespace service {
	
	export class ProjectData {
	    kubeConfig: string;
	    // Go type: ssh.RsaKeyPair
	    sshKey: any;
	    // Go type: k4p.Cluster
	    cluster: any;
	
	    static createFrom(source: any = {}) {
	        return new ProjectData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.kubeConfig = source["kubeConfig"];
	        this.sshKey = this.convertValues(source["sshKey"], null);
	        this.cluster = this.convertValues(source["cluster"], null);
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
	export class Feature {
	    name: string;
	    args: string;
	    kubernetesObjectDefinition: string;
	
	    static createFrom(source: any = {}) {
	        return new Feature(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.args = source["args"];
	        this.kubernetesObjectDefinition = source["kubernetesObjectDefinition"];
	    }
	}
	export class Cluster {
	    nodeUsername: string;
	    nodePassword: string;
	    features: Feature[];
	    nodeDiskSize: number;
	    nodes: KubernetesNode[];
	    // Go type: Network
	    network: any;
	
	    static createFrom(source: any = {}) {
	        return new Cluster(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodeUsername = source["nodeUsername"];
	        this.nodePassword = source["nodePassword"];
	        this.features = this.convertValues(source["features"], Feature);
	        this.nodeDiskSize = source["nodeDiskSize"];
	        this.nodes = this.convertValues(source["nodes"], KubernetesNode);
	        this.network = this.convertValues(source["network"], null);
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
	    installKubernetes: boolean;
	    joinNodesToCluster: boolean;
	    installFeatures: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProvisionStage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.createVirtualMachines = source["createVirtualMachines"];
	        this.installKubernetes = source["installKubernetes"];
	        this.joinNodesToCluster = source["joinNodesToCluster"];
	        this.installFeatures = source["installFeatures"];
	    }
	}
	export class ProvisionRequest {
	    // Go type: ProvisionStage
	    stages: any;
	    // Go type: Cluster
	    notUsed: any;
	
	    static createFrom(source: any = {}) {
	        return new ProvisionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.stages = this.convertValues(source["stages"], null);
	        this.notUsed = this.convertValues(source["notUsed"], null);
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

