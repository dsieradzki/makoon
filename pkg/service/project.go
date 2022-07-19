package service

import (
	"context"
	"errors"
	"fmt"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/utils"
	"github.com/dsieradzki/k4prox/internal/utils/task"
	"github.com/goccy/go-yaml"
	log "github.com/sirupsen/logrus"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"os"
	"os/exec"
	system_runtime "runtime"
	"sort"
	"strings"
)

const defaultIngressLb = `
apiVersion: v1
kind: Service
metadata:
  name: ingress
  namespace: ingress
spec:
  selector:
    name: nginx-ingress-microk8s
  type: LoadBalancer
  # loadBalancerIP is optional. MetalLB will automatically allocate an IP
  # from its pool if not specified. You can also specify one manually.
  loadBalancerIP: {{LB_IP}}
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 80
    - name: https
      protocol: TCP
      port: 443
      targetPort: 443
`

var k4proxFilters = []runtime.FileFilter{
	{
		DisplayName: "K4Prox Yaml (*.yaml, *.yml)",
		Pattern:     "*.yml;*.yaml",
	},
}

const maxNumberOfKubeNodeProposal = 20

type ProjectData struct {
	KubeConfig string         `json:"kubeConfig" yaml:"kubeConfig"`
	SshKey     ssh.RsaKeyPair `json:"sshKey" yaml:"sshKey"`
	Cluster    k4p.Cluster    `json:"cluster" yaml:"cluster"`
}

func NewProjectService(proxmoxClient *proxmox.Client) *ProjectService {
	return &ProjectService{
		proxmoxClient: proxmoxClient,
	}
}

type ProjectService struct {
	ctx           context.Context
	projectFile   string
	proxmoxClient *proxmox.Client
}

func (p *ProjectService) SetContext(ctx context.Context) {
	p.ctx = ctx
}

func (p *ProjectService) OpenProjectDialog() (bool, error) {
	projectFileName, err := runtime.OpenFileDialog(p.ctx, runtime.OpenDialogOptions{
		DefaultDirectory: getHomeDir(),
		Title:            "Open K4Prox project file",
		Filters:          k4proxFilters,
	})
	if err != nil {
		return false, err
	}
	if len(projectFileName) == 0 {
		return false, errors.New("file not specified")
	}
	p.projectFile = projectFileName
	project, err := p.LoadProject()
	return len(project.KubeConfig) > 0, err

}

func (p *ProjectService) SaveProjectDialog() (bool, error) {
	projectFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "kubernetes-cluster-1.yaml",
		Title:            "Save K4Prox project file",
		Filters:          k4proxFilters,
	})
	if err != nil {
		return false, err
	}
	if len(projectFileName) == 0 {
		return false, errors.New("file not specified")
	}

	err = p.generateDefaultProject(projectFileName)
	p.projectFile = projectFileName
	return false, err
}

func (p *ProjectService) SaveKubeConfigDialog() error {
	kubeConfigFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "config",
		Title:            "Save Kubernetes config",
		Filters:          k4proxFilters,
	})
	if err != nil {
		return err
	}

	project, err := p.LoadProject()
	if err != nil {
		return err
	}

	file, err := os.Create(kubeConfigFileName)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = file.Write([]byte(project.KubeConfig))
	return err
}

func (p *ProjectService) SaveSshPrivateKeyDialog() error {
	kubeConfigFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "cluster.pem",
		Title:            "Save SSH private key",
	})
	if err != nil {
		return err
	}

	project, err := p.LoadProject()
	if err != nil {
		return err
	}

	file, err := os.Create(kubeConfigFileName)
	if err != nil {
		return err
	}
	defer file.Close()
	if _, err = file.Write(project.SshKey.PrivateKey); err != nil {
		return err
	}
	return file.Sync()
}

func (p *ProjectService) SaveSshAuthorizationKeyDialog() error {
	kubeConfigFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "cluster.txt",
		Title:            "Save SSH authorization key",
	})
	if err != nil {
		return err
	}

	project, err := p.LoadProject()
	if err != nil {
		return err
	}

	file, err := os.Create(kubeConfigFileName)
	if err != nil {
		return err
	}
	defer file.Close()
	if _, err = file.Write(project.SshKey.PublicKey); err != nil {
		return err
	}
	return file.Sync()
}

func (p *ProjectService) LoadProject() (ProjectData, error) {
	projectFileData, err := os.ReadFile(p.projectFile)
	if err != nil {
		return ProjectData{}, err
	}

	var project ProjectData
	err = yaml.Unmarshal(projectFileData, &project)
	if err != nil {
		log.WithError(err).Error("cannot read projects")
	}
	return project, err
}

func (p *ProjectService) SaveProject(project ProjectData) error {
	currentProject, err := p.LoadProject()
	if err != nil {
		return err
	}
	// Safe project saving, to prevent override ssh and kubeconfig
	currentProject.Cluster = project.Cluster
	if len(currentProject.KubeConfig) == 0 {
		currentProject.KubeConfig = project.KubeConfig
	}

	if currentProject.SshKey.Empty() {
		currentProject.SshKey.PrivateKey = project.SshKey.PrivateKey
		currentProject.SshKey.PublicKey = project.SshKey.PublicKey
	}

	sort.Slice(currentProject.Cluster.Nodes, func(i, j int) bool {
		return currentProject.Cluster.Nodes[i].Vmid < currentProject.Cluster.Nodes[j].Vmid
	})

	return saveProject(p.projectFile, currentProject)
}

func (p *ProjectService) generateDefaultProject(fileName string) error {
	defaultStorage, err := p.getDefaultStorage()
	if err != nil {
		return err
	}

	defaultNetwork, err := p.getDefaultNetwork()
	if err != nil {
		return err
	}

	defaultVmId, err := p.getDefaultVmId()
	if err != nil {
		return err
	}

	networkPartAddress, firstFreeHostPartIp, err := p.getFirstAddressFromFreePool()
	var ingressLB, metallbIpRange, firstNodeIP, secondNodeIP, thirdNodeIP string
	if err != nil {
		ingressLB, metallbIpRange, firstNodeIP, secondNodeIP, thirdNodeIP = "", "", "", "", ""
	} else {
		ingressLB = fmt.Sprintf("%s.%d", networkPartAddress, firstFreeHostPartIp)
		firstNodeIP = fmt.Sprintf("%s.%d", networkPartAddress, firstFreeHostPartIp+10)
		secondNodeIP = fmt.Sprintf("%s.%d", networkPartAddress, firstFreeHostPartIp+11)
		thirdNodeIP = fmt.Sprintf("%s.%d", networkPartAddress, firstFreeHostPartIp+12)
		metallbIpRange = fmt.Sprintf(":%s.%d-%s.%d", networkPartAddress, firstFreeHostPartIp, networkPartAddress, firstFreeHostPartIp+9)
	}

	defaultProject := ProjectData{
		KubeConfig: "",
		SshKey:     ssh.RsaKeyPair{},
		Cluster: k4p.Cluster{
			NodeUsername: "k4prox",
			NodePassword: "k4prox",
			Features: []k4p.Feature{
				{
					Name:                       "dns",
					Args:                       "",
					KubernetesObjectDefinition: "",
				},
				{
					Name:                       "ingress",
					Args:                       "",
					KubernetesObjectDefinition: strings.ReplaceAll(defaultIngressLb, "{{LB_IP}}", ingressLB),
				},
				{
					Name:                       "metallb",
					Args:                       metallbIpRange,
					KubernetesObjectDefinition: "",
				},
			},
			NodeDiskSize: 32,
			Nodes: []k4p.KubernetesNode{
				{
					Name:        "microk8s-master-1",
					Vmid:        defaultVmId,
					Cores:       2,
					Memory:      2048,
					IpAddress:   firstNodeIP,
					StoragePool: defaultStorage,
					NodeType:    k4p.Master,
				},
				{
					Name:        "microk8s-master-2",
					Vmid:        defaultVmId + 1,
					Cores:       2,
					Memory:      2048,
					IpAddress:   secondNodeIP,
					StoragePool: defaultStorage,
					NodeType:    k4p.Master,
				},
				{
					Name:        "microk8s-master-3",
					Vmid:        defaultVmId + 2,
					Cores:       2,
					Memory:      2048,
					IpAddress:   thirdNodeIP,
					StoragePool: defaultStorage,
					NodeType:    k4p.Master,
				},
			},
			Network: k4p.Network{
				Gateway:    defaultNetwork.Gateway,
				SubnetMask: defaultNetwork.GetCIDRSubMask(),
				DnsServer:  defaultNetwork.Gateway,
				Bridge:     defaultNetwork.Iface,
			},
		},
	}
	return saveProject(fileName, defaultProject)

}
func (p *ProjectService) getDefaultStorage() (string, error) {
	storages, err := p.proxmoxClient.GetStorage()
	if err != nil {
		return "", err
	}
	for _, v := range storages {
		if v.StorageName == "local-lvm" {
			return v.StorageName, nil
		}
	}
	if len(storages) > 0 {
		return storages[0].StorageName, nil
	}
	return "", errors.New("cannot find any storage")
}

func (p *ProjectService) getDefaultNetwork() (proxmox.Network, error) {
	proxmoxNodeName, err := p.proxmoxClient.DetermineProxmoxNodeName()
	if err != nil {
		return proxmox.Network{}, err
	}
	networks, err := p.proxmoxClient.GetNetworkBridges(proxmoxNodeName)
	if err != nil {
		return proxmox.Network{}, err
	}
	for _, network := range networks {
		if network.Address == p.proxmoxClient.GetProxmoxHost() {
			return network, nil
		}
	}
	log.Warn("cannot find network where proxmox is working on, return empty")
	return proxmox.Network{}, nil
}

func (p *ProjectService) getDefaultVmId() (uint32, error) {
	vmIds, err := p.proxmoxClient.GetAllUsedVMIds()
	if err != nil {
		return 0, err
	}
	vmIds = collect.Sort(vmIds, func(a uint32, b uint32) bool {
		return a < b
	})
	return findStartIdForFreeIdWindow(vmIds, maxNumberOfKubeNodeProposal), nil
}

func (p *ProjectService) getFirstAddressFromFreePool() (string, int, error) {
	defaultNetwork, err := p.getDefaultNetwork()
	if err != nil {
		return "", 0, err
	}
	if isCheckIPToolAvailable() {
		return findIpRangeForNetwork(defaultNetwork)
	} else {
		log.Warn("tool for checking IP is not available")
		return "", 0, errors.New("tool for checking IP is not available")
	}
}

func isCheckIPToolAvailable() bool {
	_, err := exec.LookPath("ping")
	return err == nil
}

func findIpRangeForNetwork(net proxmox.Network) (string, int, error) {
	lastOctetIndex := strings.LastIndex(net.Gateway, ".")
	networkPart := net.Gateway[0:lastOctetIndex]

	for i := 10; i <= 240; i = i + maxNumberOfKubeNodeProposal {
		pingResult := pingHostRange(networkPart, i, i+maxNumberOfKubeNodeProposal)
		if pingResult.Error != nil {
			return "", 0, pingResult.Error
		}
		if pingResult.Value {
			continue // When even one ping return successfully omit this ip range
		} else {
			return networkPart, i, nil
		}
	}
	return "", 0, nil
}

func pingHostRange(networkPart string, lIP int, hIP int) task.Result[bool] {
	log.Debugf("Check ip from %s.%d to %s.%d", networkPart, lIP, networkPart, hIP-1)

	var results []task.Result[bool]
	//noinspection ALL
	if system_runtime.GOOS == "linux" {
		log.Warn("due to errors in exec.Comand on Linux check will be fired in single goroutine")
		for i := lIP; i < hIP; i++ {
			ipToCheck := fmt.Sprintf("%s.%d", networkPart, i)
			available, err := utils.PingHost(ipToCheck)
			log.Debugf("Ping [%s] host to check IP reservation. Host available: [%t]", ipToCheck, available)
			// Optimize single thread checking
			if available {
				return task.Result[bool]{
					Value: available,
					Error: err,
				}
			}
			results = append(results, task.Result[bool]{
				Value: available,
				Error: err,
			})
		}
	} else {
		taskExecutor := task.NewTaskExecutor[bool]()
		for i := lIP; i < hIP; i++ {
			taskExecutor.
				AddTask(
					context.WithValue(context.Background(), "ip", i),
					func(ctx context.Context) (bool, error) {
						ipToCheck := fmt.Sprintf("%s.%d", networkPart, ctx.Value("ip"))
						available, err := utils.PingHost(ipToCheck)
						log.Debugf("Ping [%s] host to check IP reservation. Host available: [%t]", ipToCheck, available)
						return available, err
					})
		}
		taskExecutor.Wait()
		results = taskExecutor.Results().Values
	}
	return collect.Reduce(
		results,
		task.Result[bool]{Value: false, Error: nil},
		func(acc task.Result[bool], next task.Result[bool]) task.Result[bool] {
			err := acc.Error
			if next.Error != nil {
				err = next.Error
			}
			return task.Result[bool]{
				Value: acc.Value || next.Value,
				Error: err,
			}
		})
}

func findStartIdForFreeIdWindow(usedIds []uint32, slotSize uint32) uint32 {

	for i := uint32(100); i < 999_999_999; i = i + 10 {

		// Find all used ID's in our proposed range
		var usedIdsInRange []uint32
		for _, u := range usedIds {
			if u >= i && u <= i+slotSize {
				usedIdsInRange = append(usedIdsInRange, u)
			}
		}

		if len(usedIdsInRange) > 0 {
			// When there are some ids in our proposed range so chose next range
			continue
		} else {
			return i // There are no used ids in our proposed range
		}
	}

	return 0 // There is practically no possible to not find unused range in that big proxmox set
}

func saveProject(fileName string, defaultProject ProjectData) error {
	projectData, err := yaml.Marshal(&defaultProject)
	if err != nil {
		log.WithError(err).Error("cannot save projects")
		return err
	}
	file, err := os.Create(fileName)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(projectData)
	return err
}

func getHomeDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return home
}
