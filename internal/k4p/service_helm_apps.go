package k4p

import (
	"fmt"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"strings"
)

func (k *Service) InstallHelmApps(cluster Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := findFirstMasterNode(cluster.Nodes)
	sshMasterNode := ssh.NewSshClientKey(cluster.NodeUsername, keyPair, firstMasterNode.IpAddress)

	for _, app := range cluster.HelmApps {
		eventSession := k.eventCollector.Startf("Install Helm app [%s]", app.ChartName)
		err := k.installHelmApp(app, sshMasterNode)
		if err != nil {
			eventSession.ReportError(err)
			return err
		}

		err = k.installAdditionalK8sResources(app.ReleaseName, app.AdditionalK8sResources, sshMasterNode)
		if err != nil {
			eventSession.ReportError(err)
			return err
		}
		eventSession.Done()
	}
	return nil
}
func (k *Service) InstallCustomHelmApps(cluster Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := findFirstMasterNode(cluster.Nodes)
	sshMasterNode := ssh.NewSshClientKey(cluster.NodeUsername, keyPair, firstMasterNode.IpAddress)

	for _, app := range cluster.CustomHelmApps {
		eventSession := k.eventCollector.Startf("Install custom Helm app [%s]", app.ChartName)
		err := k.installHelmApp(app, sshMasterNode)
		if err != nil {
			eventSession.ReportError(err)
			return err
		}

		err = k.installAdditionalK8sResources(app.ReleaseName, app.AdditionalK8sResources, sshMasterNode)
		if err != nil {
			eventSession.ReportError(err)
			return err
		}
		eventSession.Done()
	}
	return nil
}
func (k *Service) installHelmApp(feature HelmApp, sshMasterNode *ssh.Client) error {
	executionResult, err := sshMasterNode.Executef("sudo microk8s.helm3 repo add %s %s", feature.ChartName, feature.Repository)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return err
	}

	executionResult, err = sshMasterNode.Execute("sudo microk8s.helm3 repo update")
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return err
	}

	valuesFileCmd := ""
	if len(feature.ValueFileContent) > 0 {
		executionResult, err = sshMasterNode.Executef("echo \"%s\" > /tmp/%s.yaml", feature.ValueFileContent, feature.ChartName)
		if err != nil {
			return err
		}
		if executionResult.IsError() {
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
		return err
	}
	if executionResult.IsError() {
		return err
	}

	if len(feature.ValueFileContent) > 0 {
		executionResult, err = sshMasterNode.Executef("sudo rm /tmp/%s.yaml", feature.ChartName)
		if err != nil {
			return err
		}
		if executionResult.IsError() {
			return err
		}
	}

	return nil
}
