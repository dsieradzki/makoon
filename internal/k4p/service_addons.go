package k4p

import (
	"github.com/dsieradzki/k4prox/internal/ssh"
)

func (k *Service) InstallAddons(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := findFirstMasterNode(provisionRequest.Nodes)
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
	executionResult, err := sshMasterNode.Executef("sudo microk8s enable %s", name)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	return nil
}
