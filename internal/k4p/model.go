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

type HelmApp struct {
	ChartName              string            `json:"chartName" yaml:"chartName"`
	Repository             string            `json:"repository" yaml:"repository"`
	ReleaseName            string            `json:"releaseName" yaml:"releaseName"`
	Namespace              string            `json:"namespace" yaml:"namespace"`
	Parameters             map[string]string `json:"parameters" yaml:"parameters"`
	AdditionalK8sResources []string          `json:"additionalK8SResources" yaml:"additionalK8SResources"`
	ValueFileContent       string            `json:"valueFileContent" yaml:"valueFileContent"`
	ProjectParams          map[string]string `json:"projectParams" yaml:"projectParams"`
}
type MicroK8sAddon struct {
	Name                   string   `json:"name" yaml:"name"`
	Args                   string   `json:"args" yaml:"args"`
	AdditionalK8sResources []string `json:"additionalK8SResources" yaml:"additionalK8SResources"`
}
type CustomK8sResource struct {
	Name    string `json:"name" yaml:"name"`
	Content string `json:"content" yaml:"content"`
}
type Cluster struct {
	NodeUsername       string              `json:"nodeUsername" yaml:"nodeUsername"`
	NodePassword       string              `json:"nodePassword" yaml:"nodePassword"`
	MicroK8sAddons     []MicroK8sAddon     `json:"microK8SAddons" yaml:"microK8SAddons"`
	HelmApps           []HelmApp           `json:"helmApps" yaml:"helmApps"`
	CustomHelmApps     []HelmApp           `json:"customHelmApps" yaml:"customHelmApps"`
	CustomK8sResources []CustomK8sResource `json:"customK8SResources" yaml:"customK8SResources"`
	NodeDiskSize       uint16              `json:"nodeDiskSize" yaml:"nodeDiskSize"`
	Nodes              []KubernetesNode    `json:"nodes" yaml:"nodes"`
	Network            Network             `json:"network" yaml:"network"`
}

type ProvisionRequest struct {
	Stages ProvisionStage `json:"stages"`
	// This declaration is ugly hack - Wails has problem with generating models when are in different packages - to fix later
	NotUsed Cluster `json:"notUsed"`
}

type ProvisionStage struct {
	CreateVirtualMachines     bool `json:"createVirtualMachines"`
	SetupVirtualMachines      bool `json:"setupVirtualMachines"`
	InstallKubernetes         bool `json:"installKubernetes"`
	JoinNodesToCluster        bool `json:"joinNodesToCluster"`
	InstallAddons             bool `json:"installAddons"`
	InstallHelmApps           bool `json:"installHelmApps"`
	InstallCustomHelmApps     bool `json:"installCustomHelmApps"`
	InstallCustomK8sResources bool `json:"installCustomK8SResources"`
}
