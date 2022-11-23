package k4p

import (
	"fmt"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"time"
)

func (k *Service) InstallAddons(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := FindFirstMasterNode(provisionRequest.Nodes)
	sshMasterNode := ssh.NewClientWithKey(provisionRequest.NodeUsername, keyPair, firstMasterNode.IpAddress)
	eventSession := k.eventCollector.Start("Enable addon [dns]")
	err := k.enableAddon("dns", sshMasterNode)
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	eventSession.Done()

	eventSession = k.eventCollector.Start("Enable addon [helm3]")
	err = k.enableAddon("helm3", sshMasterNode)
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	eventSession.Done()

	return nil
}

func (k *Service) enableAddon(name string, sshMasterNode *ssh.Client) error {
	executionResult, err := sshMasterNode.ExecuteWithOptions(ssh.ExecuteOptions{
		Command:            fmt.Sprintf("sudo microk8s enable %s", name),
		Retries:            3,
		TimeBetweenRetries: 5 * time.Second,
	})
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	return nil
}
