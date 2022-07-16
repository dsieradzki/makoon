package k4p

type NodeType string

const Master NodeType = "master"
const Worker NodeType = "worker"

type KubernetesNode struct {
	Name        string   `json:"name" yaml:"name"`
	Vmid        uint32   `json:"vmid" yaml:"vmid"`
	Cores       uint16   `json:"cores" yaml:"cores"`
	Memory      uint16   `json:"memory" yaml:"memory"`
	IpAddress   string   `json:"ipAddress" yaml:"ipAddress"`
	StoragePool string   `json:"storagePool" yaml:"storagePool"`
	NodeType    NodeType `json:"nodeType" yaml:"nodeType"`
}

type Network struct {
	Gateway    string `json:"gateway" yaml:"gateway"`
	SubnetMask uint8  `json:"subnetMask" yaml:"subnetMask"`
	DnsServer  string `json:"dnsServer" yaml:"dnsServer"`
	Bridge     string `json:"bridge" yaml:"bridge"`
}

type Feature struct {
	Name                       string `json:"name"`
	Args                       string `json:"args"`
	KubernetesObjectDefinition string `json:"kubernetesObjectDefinition"`
}

type Cluster struct {
	NodeUsername string           `json:"nodeUsername" yaml:"nodeUsername"`
	NodePassword string           `json:"nodePassword" yaml:"nodePassword"`
	Features     []Feature        `json:"features" yaml:"features"`
	NodeDiskSize uint16           `json:"nodeDiskSize" yaml:"nodeDiskSize"`
	Nodes        []KubernetesNode `json:"nodes" yaml:"nodes"`
	Network      Network          `json:"network" yaml:"network"`
}

type ProvisionRequest struct {
	Stages ProvisionStage `json:"stages"`
	// This declaration is ugly hack - Wails has problem with generating models when are in different packages - to fix later
	NotUsed Cluster `json:"notUsed"`
}

type ProvisionStage struct {
	CreateVirtualMachines bool `json:"createVirtualMachines"`
	InstallKubernetes     bool `json:"installKubernetes"`
	JoinNodesToCluster    bool `json:"joinNodesToCluster"`
	InstallFeatures       bool `json:"installFeatures"`
}
