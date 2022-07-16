package k4p

import (
	log "github.com/sirupsen/logrus"
	"k4prox/internal/ssh"
	"k4prox/internal/utils"
	"sync"
	"time"
)

func (k *Service) StartVirtualMachines(cluster Cluster, keyPair ssh.RsaKeyPair) error {
	var anyNodeErr error
	var wg sync.WaitGroup
	wg.Add(len(cluster.Nodes))

	for _, node := range cluster.Nodes {
		go func(node KubernetesNode) {
			err := k.startVirtualMachine(cluster, node, keyPair)
			if err != nil {
				anyNodeErr = err
			}
			wg.Done()
		}(node)

	}
	wg.Wait()
	return anyNodeErr
}

func (k *Service) startVirtualMachine(cluster Cluster, node KubernetesNode, keyPair ssh.RsaKeyPair) error {
	eventSession := k.eventCollector.Startf("[VM%d] Start virtual machine", node.Vmid)
	err := k.proxmoxClient.StartVM(node.Vmid)
	if err != nil {
		eventSession.ReportError(err)
		return err
	}

	sshNode := ssh.NewSshClientKey(cluster.NodeUsername, keyPair, node.IpAddress)
	err = utils.Retry(30, 10*time.Second,
		func(attempt int) error {
			log.Infof("waiting for start [%d] VM, attempt [%d]", node.Vmid, attempt)
			execute, err := sshNode.Execute("time")
			if err != nil {
				return err // Happen only on Proxmox API error
			}
			if execute.IsError() {
				return execute.Error()
			} else {
				return nil
			}
		})

	if err != nil {
		eventSession.ReportError(err)
		return err
	} else {
		eventSession.Done()
		return nil
	}
}
