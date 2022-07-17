package k4p

import (
	"errors"
	"github.com/dsieradzki/K4Prox/internal/proxmox"
	"github.com/dsieradzki/K4Prox/internal/utils"
	log "github.com/sirupsen/logrus"
	"sync"
	"time"
)

func (k *Service) ShutdownVirtualMachines(cluster Cluster) error {
	var anyNodeErr error
	var wg sync.WaitGroup
	wg.Add(len(cluster.Nodes))

	for _, node := range cluster.Nodes {
		go func(node KubernetesNode) {
			err := k.shutdownVirtualMachine(node)
			if err != nil {
				anyNodeErr = err
			}
			wg.Done()
		}(node)

	}
	wg.Wait()
	return anyNodeErr
}

func (k *Service) shutdownVirtualMachine(node KubernetesNode) error {
	// Shutdown VM's
	eventSession := k.eventCollector.Startf("[VM%d] Shutdown virtual machine", node.Vmid)
	err := k.proxmoxClient.ShutdownVM(node.Vmid)
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	err = utils.Retry(30, 10*time.Second,
		func(attempt int) error {
			log.Infof("waiting for shutdown [%d] VM, attempt [%d]", node.Vmid, attempt)
			vmStatus, err := k.proxmoxClient.CurrentVMStatus(node.Vmid)
			if err != nil {
				return err // Happen only on Proxmox API error
			}
			if vmStatus == proxmox.VmStatusStopped {
				return nil
			} else {
				return errors.New("VM is still running")
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
