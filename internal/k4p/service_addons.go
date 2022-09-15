package k4p

import (
	"github.com/dsieradzki/k4prox/internal/ssh"
)

func (k *Service) InstallAddons(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := findFirstMasterNode(provisionRequest.Nodes)
	sshMasterNode := ssh.NewClientWithKey(provisionRequest.NodeUsername, keyPair, firstMasterNode.IpAddress)

	eventSession := k.eventCollector.Start("Enable community addons repository")
	executionResult, err := sshMasterNode.Execute("sudo microk8s enable community")
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return executionResult.Error()
	}
	eventSession.Done()

	// add mandatory addons
	addonsToProcess := make([]MicroK8sAddon, 0)

	addonsToProcess = append(addonsToProcess, MicroK8sAddon{
		Name:                   "dns",
		Args:                   "",
		AdditionalK8sResources: nil,
	})

	addonsToProcess = append(addonsToProcess, MicroK8sAddon{
		Name:                   "helm3",
		Args:                   "",
		AdditionalK8sResources: nil,
	})
	addonsToProcess = append(addonsToProcess, provisionRequest.MicroK8sAddons...)

	for _, feature := range addonsToProcess {
		eventSession := k.eventCollector.Startf("Enable addon [%s]", feature.Name)
		err := k.enableAddon(feature, sshMasterNode)
		if err != nil {
			eventSession.ReportError(err)
			return err
		}

		err = k.installAdditionalK8sResources(feature.Name, feature.AdditionalK8sResources, sshMasterNode)
		if err != nil {
			eventSession.ReportError(err)
			return err
		}
		eventSession.Done()
	}

	return nil
}

func (k *Service) enableAddon(feature MicroK8sAddon, sshMasterNode *ssh.Client) error {
	featureCommand := feature.Name
	if len(feature.Args) > 0 {
		featureCommand = featureCommand + feature.Args
	}
	executionResult, err := sshMasterNode.Executef("sudo microk8s enable %s", featureCommand)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	return nil
}
