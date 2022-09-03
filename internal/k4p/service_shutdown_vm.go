package k4p

import (
	"context"
	"errors"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/utils"
	"github.com/dsieradzki/k4prox/internal/utils/task"
	log "github.com/sirupsen/logrus"
	"time"
)

func (k *Service) ShutdownVirtualMachines(cluster Cluster) error {
	executor := task.NewTaskExecutor[any]()

	for _, node := range cluster.Nodes {
		executor.AddTask(
			context.WithValue(context.Background(), "NODE", node),
			func(c context.Context) (any, error) {
				nodeToShutdown := c.Value("NODE").(KubernetesNode)
				return nil, k.shutdownVirtualMachine(nodeToShutdown)
			})
	}

	executor.Wait()
	return executor.Results().AnyError()
}

func (k *Service) shutdownVirtualMachine(node KubernetesNode) error {
	// Shutdown VM's
	eventSession := k.eventCollector.StartWithDetails("Shutdown virtual machine", k.generateVmIdDetails(node.Vmid))
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
