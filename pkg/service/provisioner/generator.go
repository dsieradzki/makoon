package provisioner

import (
	"context"
	"errors"
	"fmt"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/utils/network"
	"github.com/dsieradzki/k4prox/internal/utils/task"
	log "github.com/sirupsen/logrus"
	systemruntime "runtime"
	"strings"
)

const freeIpWindowProposal = 20

func NewGenerator(proxmoxClient *proxmox.Client) *Generator {
	return &Generator{
		proxmoxClient: proxmoxClient,
	}
}

type Generator struct {
	proxmoxClient *proxmox.Client
}

func (g *Generator) GenerateDefaultCluster() (k4p.Cluster, error) {
	defaultStorage, err := g.getDefaultStorage()
	if err != nil {
		return k4p.Cluster{}, err
	}

	defaultNetwork, err := g.getDefaultNetwork()
	if err != nil {
		return k4p.Cluster{}, err
	}

	defaultVmId, err := g.getDefaultVmId()
	if err != nil {
		return k4p.Cluster{}, err
	}

	networkPartAddress, firstFreeHostPartIp, err := g.getFirstAddressFromFreePool()
	var firstNodeIP, secondNodeIP, thirdNodeIP string
	if err != nil {
		log.Warn("cannot detect network settings")
		firstNodeIP, secondNodeIP, thirdNodeIP = "", "", ""
	} else {
		firstNodeIP = fmt.Sprintf("%s.%d", networkPartAddress, firstFreeHostPartIp+10)
		secondNodeIP = fmt.Sprintf("%s.%d", networkPartAddress, firstFreeHostPartIp+11)
		thirdNodeIP = fmt.Sprintf("%s.%d", networkPartAddress, firstFreeHostPartIp+12)
	}

	var nodes []k4p.KubernetesNode
	if len(defaultStorage) > 0 {
		nodes = []k4p.KubernetesNode{
			{
				NameSuffux:  "master-1",
				Vmid:        defaultVmId,
				Cores:       2,
				Memory:      3072,
				IpAddress:   firstNodeIP,
				StoragePool: defaultStorage,
				NodeType:    k4p.Master,
			},
			{
				NameSuffux:  "master-2",
				Vmid:        defaultVmId + 1,
				Cores:       2,
				Memory:      3072,
				IpAddress:   secondNodeIP,
				StoragePool: defaultStorage,
				NodeType:    k4p.Master,
			},
			{
				NameSuffux:  "master-3",
				Vmid:        defaultVmId + 2,
				Cores:       2,
				Memory:      3072,
				IpAddress:   thirdNodeIP,
				StoragePool: defaultStorage,
				NodeType:    k4p.Master,
			},
		}
	}

	return k4p.Cluster{
		ClusterName:  "",
		KubeConfig:   "",
		SshKey:       ssh.RsaKeyPair{},
		NodeUsername: "k4prox",
		NodePassword: "k4prox",
		HelmApps:     []k4p.HelmApp{},
		K8sResources: []k4p.K8sResource{},
		NodeDiskSize: 32,
		Nodes:        nodes,
		Network: k4p.Network{
			Gateway:    defaultNetwork.Gateway,
			SubnetMask: defaultNetwork.GetCIDRSubMask(),
			DnsServer:  defaultNetwork.Gateway,
			Bridge:     defaultNetwork.Iface,
		},
	}, nil

}

func (g *Generator) getDefaultStorage() (string, error) {
	storages, err := g.proxmoxClient.GetStorage()
	if err != nil {
		log.WithError(err).Error("cannot get storages from proxmox")
		return "", err
	}
	log.WithField("count", len(storages)).Debug("found storages")
	for _, v := range storages {
		if v.StorageName == "local-lvm" {
			log.Debug("found local-lvm storage")
			return v.StorageName, nil
		}
	}
	if len(storages) > 0 {
		storageName := storages[0].StorageName
		log.Warnf("not found local-lvm storage, first of found will be returned [%s]", storageName)
		return storageName, nil
	}
	return "", nil
}

func (g *Generator) getDefaultNetwork() (proxmox.Network, error) {
	proxmoxNodeName, err := g.proxmoxClient.DetermineProxmoxNodeName()
	if err != nil {
		return proxmox.Network{}, err
	}
	networks, err := g.proxmoxClient.GetNetworkBridges(proxmoxNodeName)
	if err != nil {
		log.WithError(err).Error("cannot find network bridges, return empty network settings")
		return proxmox.Network{}, err
	}
	for _, net := range networks {
		if net.Address == g.proxmoxClient.GetProxmoxHost() {
			log.Debug("found network where proxmox is working on")
			return net, nil
		}
	}
	log.Warn("cannot find network where proxmox is working on, return empty network")
	return proxmox.Network{}, nil
}

func (g *Generator) getDefaultVmId() (uint32, error) {
	vmIds, err := g.proxmoxClient.GetAllUsedVMIds()
	if err != nil {
		return 0, err
	}
	vmIds = collect.Sort(vmIds, func(a uint32, b uint32) bool {
		return a < b
	})
	return findStartIdForFreeIdWindow(vmIds, freeIpWindowProposal), nil
}

func (g *Generator) getFirstAddressFromFreePool() (string, int, error) {
	defaultNetwork, err := g.getDefaultNetwork()
	if err != nil {
		return "", 0, err
	}
	if network.IsCheckIPToolAvailable() {
		return findIpRangeForNetwork(defaultNetwork)
	} else {
		log.Warn("tool for checking IP is not available")
		return "", 0, errors.New("tool for checking IP is not available")
	}
}

func findIpRangeForNetwork(net proxmox.Network) (string, int, error) {
	if len(net.Gateway) == 0 {
		return "", 0, errors.New("no gateway")
	}
	lastOctetIndex := strings.LastIndex(net.Gateway, ".")
	networkPart := net.Gateway[0:lastOctetIndex]

	for i := 10; i <= 240; i = i + freeIpWindowProposal {
		pingResult := pingHostRange(networkPart, i, i+freeIpWindowProposal)
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
	if systemruntime.GOOS == "linux" {
		log.Warn("due to errors in exec.Comand on Linux check will be fired in single goroutine")
		for i := lIP; i < hIP; i++ {
			ipToCheck := fmt.Sprintf("%s.%d", networkPart, i)
			available, err := network.PingHost(ipToCheck)
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
						available, err := network.PingHost(ipToCheck)
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
