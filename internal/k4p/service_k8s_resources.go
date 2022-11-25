package k4p

import (
	"github.com/dsieradzki/k4prox/internal/ssh"
	"strings"
)

func (k *Service) InstallAdditionalK8sResources(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := FindFirstMasterNode(provisionRequest.Nodes)
	sshMasterNode := ssh.NewClientWithKey(provisionRequest.NodeUsername, keyPair, firstMasterNode.IpAddress)

	for _, k8sResource := range provisionRequest.K8sResources {
		if len(k8sResource.Content) > 0 {
			eventSession := k.eventCollector.Startf("Apply resource [%s]", k8sResource.Name)
			err := k.ApplyK8sResource(k8sResource, sshMasterNode)
			if err != nil {
				eventSession.ReportError(err)
				return err
			}
			eventSession.Done()
		}
	}
	return nil
}

func (k *Service) ApplyK8sResource(req K8sResource, client *ssh.Client) error {
	resourceFileName := generateFileName(req.Name)
	escapedContent := escapeContent(req.Content)

	executionResult, err := client.Executef("echo \"%s\" > /tmp/%s.yaml", escapedContent, resourceFileName)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	executionResult, err = client.Executef("sudo microk8s.kubectl apply -f /tmp/%s.yaml", resourceFileName)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	executionResult, err = client.Executef("sudo rm /tmp/%s.yaml", resourceFileName)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	return nil
}

func (k *Service) DeleteK8sResource(req K8sResource, client *ssh.Client) error {
	resourceFileName := generateFileName(req.Name)
	escapedContent := escapeContent(req.Content)

	executionResult, err := client.Executef("echo \"%s\" > /tmp/%s.yaml", escapedContent, resourceFileName)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	executionResult, err = client.Executef("sudo microk8s.kubectl delete -f /tmp/%s.yaml", resourceFileName)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	executionResult, err = client.Executef("sudo rm /tmp/%s.yaml", resourceFileName)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	return nil
}

func generateFileName(resName string) string {
	return strings.TrimSpace(strings.ReplaceAll(resName, " ", "_"))
}

func escapeContent(content string) string {
	return strings.ReplaceAll(content, `"`, `\"`)
}
