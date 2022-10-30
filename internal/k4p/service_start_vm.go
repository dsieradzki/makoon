package k4p

import (
	"context"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/utils"
	"github.com/dsieradzki/k4prox/internal/utils/task"
	log "github.com/sirupsen/logrus"
	"time"
)

func (k *Service) StartVirtualMachines(cluster Cluster, keyPair ssh.RsaKeyPair) error {
	executor := task.NewTaskExecutor[any]()

	for _, node := range cluster.Nodes {
		executor.AddTask(
			context.WithValue(context.Background(), "NODE", node),
			func(c context.Context) (any, error) {
				nodeToStart := c.Value("NODE").(KubernetesNode)
				return nil, k.startVirtualMachine(cluster, nodeToStart, keyPair)
			})
	}

	executor.Wait()
	return executor.Results().AnyError()
}

func (k *Service) startVirtualMachine(cluster Cluster, node KubernetesNode, keyPair ssh.RsaKeyPair) error {
	eventSession := k.eventCollector.StartWithDetails("Start virtual machine", k.generateVmIdDetails(node.Vmid))
	err := k.proxmoxClient.StartVM(node.Vmid)
	if err != nil {
		eventSession.ReportError(err)
		return err
	}

	sshNode := ssh.NewClientWithKey(cluster.NodeUsername, keyPair, node.IpAddress)
	err = utils.Retry(30, 10*time.Second,
		func(attempt uint) error {
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
