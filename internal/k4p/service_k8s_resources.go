package k4p

import (
	"github.com/dsieradzki/k4prox/internal/ssh"
	"strings"
)

func (k *Service) InstallAdditionalK8sResources(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := findFirstMasterNode(provisionRequest.Nodes)
	sshMasterNode := ssh.NewClientWithKey(provisionRequest.NodeUsername, keyPair, firstMasterNode.IpAddress)

	for _, k8sResource := range provisionRequest.CustomK8sResources {
		if len(k8sResource.Content) > 0 {
			eventSession := k.eventCollector.Startf("Apply resource [%s]", k8sResource.Name)
			escapedContent := strings.ReplaceAll(k8sResource.Content, `"`, `\"`)
			executionResult, err := sshMasterNode.Executef("echo \"%s\" > /tmp/%s.yaml", escapedContent, k8sResource.Name)
			if err != nil {
				eventSession.ReportError(err)
				return err
			}
			if executionResult.IsError() {
				eventSession.ReportError(executionResult.Error())
				return executionResult.Error()
			}
			executionResult, err = sshMasterNode.Executef("sudo microk8s.kubectl apply -f /tmp/%s.yaml", k8sResource.Name)
			if err != nil {
				eventSession.ReportError(err)
				return err
			}
			if executionResult.IsError() {
				eventSession.ReportError(executionResult.Error())
				return executionResult.Error()
			}
			executionResult, err = sshMasterNode.Executef("sudo rm /tmp/%s.yaml", k8sResource.Name)
			if err != nil {
				eventSession.ReportError(err)
				return err
			}
			if executionResult.IsError() {
				eventSession.ReportError(executionResult.Error())
				return executionResult.Error()
			}
			eventSession.Done()
		}
	}
	return nil
}
