package k4p

import (
	"fmt"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/event"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"strings"
)

func (k *Service) InstallFeatures(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := findFirstMasterNode(provisionRequest.Nodes)
	sshMasterNode := ssh.NewSshClientKey(provisionRequest.NodeUsername, keyPair, firstMasterNode.IpAddress)

	eventSession := k.eventCollector.Start("Enable community addons")
	executionResult, err := sshMasterNode.Execute("sudo microk8s enable community")
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return err
	}
	eventSession.Done()

	for _, feature := range provisionRequest.MicroK8sAddons {
		eventSession := k.eventCollector.Startf("Enable addon [%s]", feature.Name)
		err := k.enableAddonFeature(feature, sshMasterNode, eventSession)
		if err != nil {
			return err
		}

		err = k.applyAdditionalK8sResources(feature.Name, feature.AdditionalK8sResources, sshMasterNode, eventSession)
		if err != nil {
			return err
		}
	}
	for _, feature := range provisionRequest.HelmApps {
		eventSession := k.eventCollector.Startf("Install Helm app [%s]", feature.ChartName)
		err := k.enableHelmFeature(feature, sshMasterNode, eventSession)
		if err != nil {
			return err
		}

		err = k.applyAdditionalK8sResources(feature.ChartName, feature.AdditionalK8sResources, sshMasterNode, eventSession)
		if err != nil {
			return err
		}
	}
	eventSession.Done()
	return nil
}
func (k *Service) enableHelmFeature(feature HelmApp, sshMasterNode *ssh.Client, eventSession *event.Session) error {
	executionResult, err := sshMasterNode.Executef("sudo microk8s.helm3 repo add %s %s", feature.ChartName, feature.Repository)
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return err
	}

	executionResult, err = sshMasterNode.Execute("sudo microk8s.helm3 repo update")
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return err
	}

	valuesFileCmd := ""
	if len(feature.ValueFileContent) > 0 {
		executionResult, err = sshMasterNode.Executef("echo \"%s\" > /tmp/%s.yaml", feature.ValueFileContent, feature.ChartName)
		if err != nil {
			eventSession.ReportError(err)
			return err
		}
		if executionResult.IsError() {
			eventSession.ReportError(executionResult.Error())
			return err
		}
		valuesFileCmd = fmt.Sprintf("-f /tmp/%s.yaml", feature.ChartName)
	}

	params := collect.MapMap(feature.Parameters, func(k string, v string) string {
		return fmt.Sprintf("--set %s=%s", k, v)
	})

	executionResult, err = sshMasterNode.Executef("sudo microk8s.helm3 upgrade --install --create-namespace -n%s %s %s %s %s",
		feature.Namespace, feature.ReleaseName, feature.ChartName+"/"+feature.ChartName, strings.Join(params, " "), valuesFileCmd)
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return err
	}

	if len(feature.ValueFileContent) > 0 {
		executionResult, err = sshMasterNode.Executef("sudo rm /tmp/%s.yaml", feature.ChartName)
		if err != nil {
			eventSession.ReportError(err)
			return err
		}
		if executionResult.IsError() {
			eventSession.ReportError(executionResult.Error())
			return err
		}
	}

	return nil
}
func (k *Service) enableAddonFeature(feature MicroK8sAddon, sshMasterNode *ssh.Client, eventSession *event.Session) error {
	featureCommand := feature.Name
	if len(feature.Args) > 0 {
		featureCommand = featureCommand + feature.Args
	}
	executionResult, err := sshMasterNode.Executef("sudo microk8s enable %s", featureCommand)
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return err
	}
	return nil
}

func (k *Service) applyAdditionalK8sResources(featureName string, resources []string, sshMasterNode *ssh.Client, eventSession *event.Session) error {
	for idx, content := range resources {
		if len(content) > 0 {
			executionResult, err := sshMasterNode.Executef("echo \"%s\" > /tmp/%s-%d.yaml", content, featureName, idx)
			if err != nil {
				eventSession.ReportError(err)
				return err
			}
			if executionResult.IsError() {
				eventSession.ReportError(executionResult.Error())
				return err
			}
			executionResult, err = sshMasterNode.Executef("sudo microk8s.kubectl apply -f /tmp/%s-%d.yaml", featureName, idx)
			if err != nil {
				eventSession.ReportError(err)
				return err
			}
			if executionResult.IsError() {
				eventSession.ReportError(executionResult.Error())
				return err
			}
			executionResult, err = sshMasterNode.Executef("sudo rm /tmp/%s-%d.yaml", featureName, idx)
			if err != nil {
				eventSession.ReportError(err)
				return err
			}
			if executionResult.IsError() {
				eventSession.ReportError(executionResult.Error())
				return err
			}
		}

	}
	return nil
}
