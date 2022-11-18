package k4p

import (
	"fmt"
	"github.com/dsieradzki/k4prox/internal/ssh"
)

type NodeType string

const Master NodeType = "master"
const Worker NodeType = "worker"

type KubernetesNode struct {
	NameSuffux  string   `json:"name" yaml:"name"`
	Vmid        uint32   `json:"vmid" yaml:"vmid"`
	Cores       uint16   `json:"cores" yaml:"cores"`
	Memory      uint16   `json:"memory" yaml:"memory"`
	IpAddress   string   `json:"ipAddress" yaml:"ipAddress"`
	StoragePool string   `json:"storagePool" yaml:"storagePool"`
	NodeType    NodeType `json:"nodeType" yaml:"nodeType"`
}

func (n *KubernetesNode) Name(prefix string) string {
	return fmt.Sprintf("%s-%s", prefix, n.NameSuffux)
}

type Network struct {
	Gateway    string `json:"gateway" yaml:"gateway"`
	SubnetMask uint8  `json:"subnetMask" yaml:"subnetMask"`
	DnsServer  string `json:"dnsServer" yaml:"dnsServer"`
	Bridge     string `json:"bridge" yaml:"bridge"`
}

type HelmApp struct {
	Id               string `json:"id"`
	ChartName        string `json:"chartName" yaml:"chartName"`
	Version          string `json:"version" yaml:"version"`
	Repository       string `json:"repository" yaml:"repository"`
	ReleaseName      string `json:"releaseName" yaml:"releaseName"`
	Namespace        string `json:"namespace" yaml:"namespace"`
	ValueFileContent string `json:"valueFileContent" yaml:"valueFileContent"`
	Wait             bool   `json:"wait" yaml:"wait"`
}

type K8sResource struct {
	Id      string `json:"id"`
	Name    string `json:"name" yaml:"name"`
	Content string `json:"content" yaml:"content"`
}
type Cluster struct {
	ClusterName  string           `json:"clusterName" yaml:"clusterName"`
	KubeConfig   string           `json:"kubeConfig" yaml:"kubeConfig"`
	SshKey       ssh.RsaKeyPair   `json:"sshKey" yaml:"sshKey"`
	NodeUsername string           `json:"nodeUsername" yaml:"nodeUsername"`
	NodePassword string           `json:"nodePassword" yaml:"nodePassword"`
	HelmApps     []HelmApp        `json:"helmApps" yaml:"helmApps"`
	K8sResources []K8sResource    `json:"k8SResources" yaml:"k8SResources"`
	NodeDiskSize uint16           `json:"nodeDiskSize" yaml:"nodeDiskSize"`
	Nodes        []KubernetesNode `json:"nodes" yaml:"nodes"`
	Network      Network          `json:"network" yaml:"network"`
}

type ProvisionRequest struct {
	Stages  ProvisionStage `json:"stages"`
	Cluster Cluster        `json:"cluster"`
}

type ProvisionStage struct {
	CreateVirtualMachines bool `json:"createVirtualMachines"`
	SetupVirtualMachines  bool `json:"setupVirtualMachines"`
	InstallKubernetes     bool `json:"installKubernetes"`
	JoinNodesToCluster    bool `json:"joinNodesToCluster"`
	InstallHelmApps       bool `json:"installCustomHelmApps"`
	InstallK8sResources   bool `json:"installCustomK8SResources"`
}
