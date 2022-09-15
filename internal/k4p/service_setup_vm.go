package k4p

import (
	"context"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/utils/task"
	log "github.com/sirupsen/logrus"
)

func (k *Service) SetupVmsOs(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	executor := task.NewTaskExecutor[any]()
	for _, node := range provisionRequest.Nodes {
		executor.AddTask(
			context.WithValue(context.Background(), "NODE", node),
			func(c context.Context) (any, error) {
				nodeToUpdate := c.Value("NODE").(KubernetesNode)
				return nil, k.setupVmOs(provisionRequest, keyPair, nodeToUpdate)
			})
	}
	executor.Wait()
	return executor.Results().AnyError()
}

func (k *Service) setupVmOs(provisionRequest Cluster, keyPair ssh.RsaKeyPair, node KubernetesNode) error {
	sshClient := ssh.NewClientWithKey(provisionRequest.NodeUsername, keyPair, node.IpAddress)
	eventSession := k.eventCollector.StartWithDetails("Setup virtual machine OS", k.generateVmIdDetails(node.Vmid))

	// iscsid is needed by OpenEBS
	executionResult, err := sshClient.Execute("sudo systemctl enable iscsid")
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return executionResult.Error()
	}
	log.Debug("VM OS configured successfully")
	log.Debug(executionResult.Output)

	eventSession.DoneWithDetails("[iscsid] service enabled")
	return nil
}
