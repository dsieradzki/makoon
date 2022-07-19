package service

import (
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/event"
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"sort"
)

func NewProvisionerService(
	projectService *ProjectService,
	proxmoxClient *proxmox.Client,
	sshClient *ssh.Client,
	eventCollector *event.Collector) *ProvisionerService {
	return &ProvisionerService{
		project:       projectService,
		proxmoxClient: proxmoxClient,
		k4p:           k4p.NewK4PService(proxmoxClient, sshClient, eventCollector),
	}
}

type ProvisionerService struct {
	k4p           *k4p.Service
	proxmoxClient *proxmox.Client
	project       *ProjectService
}

func (p *ProvisionerService) SetupEnvironmentOnProxmox() error {
	return p.k4p.SetupEnvironmentOnProxmox()
}

func (p *ProvisionerService) CreateCluster(provisionRequest k4p.ProvisionRequest) error {
	project, err := p.project.LoadProject()
	if err != nil {
		return err
	}
	if project.SshKey.Empty() {
		rsaKeyPair, err := ssh.GenerateRsaKeyPair()
		if err != nil {
			return err
		}
		project.SshKey = rsaKeyPair
		err = p.project.SaveProject(project)
		if err != nil {
			return err
		}
	}
	if provisionRequest.Stages.CreateVirtualMachines {
		err = p.k4p.CreateVirtualMachines(project.Cluster, project.SshKey)
		if err != nil {
			return err
		}

		err = p.k4p.StartVirtualMachines(project.Cluster, project.SshKey)
		if err != nil {
			return err
		}

		err = p.k4p.UpdateVmsOs(project.Cluster, project.SshKey)
		if err != nil {
			return err
		}

		err = p.k4p.ShutdownVirtualMachines(project.Cluster)
		if err != nil {
			return err
		}

		err = p.k4p.StartVirtualMachines(project.Cluster, project.SshKey)
		if err != nil {
			return err
		}
	}
	if provisionRequest.Stages.InstallKubernetes {
		err = p.k4p.InstallKubernetesOnNodes(project.Cluster, project.SshKey)
		if err != nil {
			return err
		}
	}
	if provisionRequest.Stages.JoinNodesToCluster {
		err = p.k4p.JoinNodesToCluster(project.Cluster, project.SshKey)
		if err != nil {
			return err
		}
	}
	if provisionRequest.Stages.InstallFeatures {
		err = p.k4p.InstallFeatures(project.Cluster, project.SshKey)
		if err != nil {
			return err
		}
	}

	if provisionRequest.Stages.InstallKubernetes {
		kubeConfigContent, err := p.k4p.GetKubeConfigFromCluster(project.Cluster, project.SshKey)
		if err != nil {
			return err
		}
		projectData, err := p.project.LoadProject()
		if err != nil {
			return err
		}
		projectData.KubeConfig = kubeConfigContent
		err = p.project.SaveProject(projectData)
		if err != nil {
			return err
		}
	}
	return nil
}

func (p *ProvisionerService) GetNetworkBridges() ([]string, error) {
	networks, err := p.proxmoxClient.GetNetworkBridges(p.proxmoxClient.GetProxmoxNodeName())
	if err != nil {
		return []string{}, err
	}
	netNames := collect.Map(networks, func(n proxmox.Network) string {
		return n.Iface
	})
	sort.Strings(netNames)
	return netNames, nil
}

func (p *ProvisionerService) GetStorage() ([]string, error) {
	storage, err := p.proxmoxClient.GetStorage()
	if err != nil {
		return []string{}, err
	}
	storageNames := collect.Map(storage, func(i proxmox.Storage) string {
		return i.StorageName
	})
	sort.Strings(storageNames)
	return storageNames, nil
}
