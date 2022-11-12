package provisioner

import (
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/event"
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/pkg/service/database"
	log "github.com/sirupsen/logrus"
	"sort"
)

func NewService(
	projectService *database.Service,
	proxmoxClient *proxmox.Client,
	sshClient *ssh.Client,
	eventCollector *event.Collector) *Service {
	return &Service{
		eventCollector: eventCollector,
		project:        projectService,
		proxmoxClient:  proxmoxClient,
		k4p:            k4p.NewK4PService(proxmoxClient, sshClient, eventCollector),
	}
}

type Service struct {
	eventCollector *event.Collector
	k4p            *k4p.Service
	proxmoxClient  *proxmox.Client
	project        *database.Service
}

func (p *Service) SetupEnvironmentOnProxmox() error {
	return p.k4p.SetupEnvironmentOnProxmox()
}

func (p *Service) CreateCluster(provisionRequest k4p.ProvisionRequest) error {
	if provisionRequest.Cluster.SshKey.Empty() {
		rsaKeyPair, err := ssh.GenerateRsaKeyPair()
		if err != nil {
			log.WithError(err).Error("Cannot generate RSA key pair")
			return err
		}
		provisionRequest.Cluster.SshKey = rsaKeyPair
	}
	loadedDatabase, err := p.project.LoadDatabase()
	if err != nil {
		log.WithError(err).Error("Cannot load database")
		return err
	}
	loadedDatabase.Clusters = append(loadedDatabase.Clusters, provisionRequest.Cluster)
	err = p.project.SaveDatabase(loadedDatabase)
	if err != nil {
		log.WithError(err).Error("Cannot save database")
		return err
	}

	if provisionRequest.Stages.CreateVirtualMachines {
		err = p.k4p.CreateVirtualMachines(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot create virtual machines")
			return err
		}

		err = p.k4p.StartVirtualMachines(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot start virtual machines")
			return err
		}

		err = p.k4p.UpdateVmsOs(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot update virtual machine OS")
			return err
		}

		err = p.k4p.ShutdownVirtualMachines(provisionRequest.Cluster)
		if err != nil {
			log.WithError(err).Error("Cannot shutdown virtual machines")
			return err
		}

		err = p.k4p.StartVirtualMachines(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot start virtual machines")
			return err
		}
	}

	if provisionRequest.Stages.SetupVirtualMachines {
		err = p.k4p.SetupVmsOs(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot setup virtual machine OS")
			return err
		}
	}

	if provisionRequest.Stages.InstallKubernetes {
		err = p.k4p.InstallKubernetesOnVms(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot install Kubernetes")
			return err
		}
	}
	if provisionRequest.Stages.JoinNodesToCluster {
		err = p.k4p.JoinNodesToCluster(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot join node to cluster")
			return err
		}
	}

	if provisionRequest.Stages.InstallKubernetes {
		kubeConfigContent, err := p.k4p.GetKubeConfigFromCluster(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot get Kubernetes config from cluster")
			return err
		}
		eventSession := p.eventCollector.Start("Add Kubernetes config to project file")

		// Update kube config
		loadedDatabase, err = p.project.LoadDatabase()
		if err != nil {
			log.WithError(err).Error("Cannot load database")
			eventSession.ReportError(err)
			return err
		}
		for i := 0; i < len(loadedDatabase.Clusters); i++ {
			if loadedDatabase.Clusters[i].ClusterName == provisionRequest.Cluster.ClusterName {
				loadedDatabase.Clusters[i].KubeConfig = kubeConfigContent
			}
		}
		err = p.project.SaveDatabase(loadedDatabase)
		if err != nil {
			log.WithError(err).Error("Cannot save project file")
			eventSession.ReportError(err)
			return err
		}
		eventSession.Done()

		err = p.k4p.InstallAddons(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot install addons")
			return err
		}
	}

	if provisionRequest.Stages.InstallCustomHelmApps {
		err = p.k4p.InstallCustomHelmApps(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot install custom Helm applications")
			return err
		}
	}
	if provisionRequest.Stages.InstallCustomK8sResources {
		err = p.k4p.InstallAdditionalK8sResources(provisionRequest.Cluster, provisionRequest.Cluster.SshKey)
		if err != nil {
			log.WithError(err).Error("Cannot install additional Kubernetes resources")
			return err
		}
	}

	return nil
}

func (p *Service) GetNetworkBridges() ([]string, error) {
	networks, err := p.proxmoxClient.GetNetworkBridges(p.proxmoxClient.GetProxmoxNodeName())
	if err != nil {
		log.WithError(err).Error("Cannot get information about network devices")
		return []string{}, err
	}
	netNames := collect.Map(networks, func(n proxmox.Network) string {
		return n.Iface
	})
	sort.Strings(netNames)
	return netNames, nil
}

func (p *Service) GetStorage() ([]string, error) {
	storage, err := p.proxmoxClient.GetStorage()
	if err != nil {
		log.WithError(err).Error("Cannot get information about storage")
		return []string{}, err
	}
	storageNames := collect.Map(storage, func(i proxmox.Storage) string {
		return i.StorageName
	})
	sort.Strings(storageNames)
	return storageNames, nil
}
