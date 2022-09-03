package k4p

import (
	"context"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/utils"
	"github.com/dsieradzki/k4prox/internal/utils/task"
	log "github.com/sirupsen/logrus"
	"time"
)

func (k *Service) UpdateVmsOs(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	executor := task.NewTaskExecutor[any]()
	for _, node := range provisionRequest.Nodes {
		executor.AddTask(
			context.WithValue(context.Background(), "NODE", node),
			func(c context.Context) (any, error) {
				nodeToUpdate := c.Value("NODE").(KubernetesNode)
				return nil, k.updateVmOs(provisionRequest, keyPair, nodeToUpdate)
			})
	}
	executor.Wait()
	return executor.Results().AnyError()
}

func (k *Service) updateVmOs(provisionRequest Cluster, keyPair ssh.RsaKeyPair, node KubernetesNode) error {
	sshClient := ssh.NewClientWithKey(provisionRequest.NodeUsername, keyPair, node.IpAddress)
	eventSession := k.eventCollector.StartWithDetails("Update virtual machine OS", k.generateVmIdDetails(node.Vmid))

	err := utils.Retry(30, 10*time.Second, func(attempt int) error {
		log.Infof("trying to update OS packages for VM [VM%d], attempt [%d]", node.Vmid, attempt)

		executionResult, err := sshClient.Execute(
			"sudo apt-get update && " +
				"sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y &&" +
				" sudo DEBIAN_FRONTEND=noninteractive apt-get autoremove -y")
		if err != nil {
			return err
		}
		if executionResult.IsError() {
			return executionResult.Error()
		}
		log.Debug("OS packages updated successfully")
		log.Debug(executionResult.Output)
		return nil
	})

	if err != nil {
		eventSession.ReportError(err)
		return err
	} else {
		eventSession.Done()
	}
	return nil
}
