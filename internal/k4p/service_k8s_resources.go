package k4p

import (
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/ssh"
)

func (k *Service) InstallAdditionalK8sResources(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := findFirstMasterNode(provisionRequest.Nodes)
	sshMasterNode := ssh.NewSshClientKey(provisionRequest.NodeUsername, keyPair, firstMasterNode.IpAddress)

	eventSession := k.eventCollector.Start("Apply custom K8S resources")
	crs := collect.Map(provisionRequest.CustomK8sResources, func(r CustomK8sResource) string {
		return r.Content
	})
	err := k.installAdditionalK8sResources("custom_k8s_resource", crs, sshMasterNode)
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	eventSession.Done()
	return nil
}
func (k *Service) installAdditionalK8sResources(featureName string, resources []string, sshMasterNode *ssh.Client) error {
	for idx, content := range resources {
		if len(content) > 0 {
			executionResult, err := sshMasterNode.Executef("echo \"%s\" > /tmp/%s-%d.yaml", content, featureName, idx)
			if err != nil {
				return err
			}
			if executionResult.IsError() {
				return err
			}
			executionResult, err = sshMasterNode.Executef("sudo microk8s.kubectl apply -f /tmp/%s-%d.yaml", featureName, idx)
			if err != nil {
				return err
			}
			if executionResult.IsError() {
				return err
			}
			executionResult, err = sshMasterNode.Executef("sudo rm /tmp/%s-%d.yaml", featureName, idx)
			if err != nil {
				return err
			}
			if executionResult.IsError() {
				return err
			}
		}

	}
	return nil
}
