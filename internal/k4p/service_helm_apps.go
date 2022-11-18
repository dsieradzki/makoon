package k4p

import (
	"fmt"
	"github.com/dsieradzki/k4prox/internal/ssh"
)

func (k *Service) InstallHelmApps(cluster Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := FindFirstMasterNode(cluster.Nodes)
	sshMasterNode := ssh.NewClientWithKey(cluster.NodeUsername, keyPair, firstMasterNode.IpAddress)

	for _, app := range cluster.HelmApps {
		eventSession := k.eventCollector.Startf("Install Helm app [%s]", app.ChartName)
		err := k.InstallHelmApp(app, sshMasterNode)
		if err != nil {
			eventSession.ReportError(err)
			return err
		}
		eventSession.Done()
	}
	return nil
}

func (k *Service) UninstallHelmApp(app HelmApp, sshMasterNode *ssh.Client) error {
	executionResult, err := sshMasterNode.Executef("sudo microk8s.helm3 uninstall %s -n %s", app.ReleaseName, app.Namespace)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	return nil
}

func (k *Service) InstallHelmApp(app HelmApp, sshMasterNode *ssh.Client) error {
	executionResult, err := sshMasterNode.Executef("sudo microk8s.helm3 repo add %s %s", app.ChartName, app.Repository)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}

	executionResult, err = sshMasterNode.Execute("sudo microk8s.helm3 repo update")
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}

	valuesFileCmd := ""
	if len(app.ValueFileContent) > 0 {
		executionResult, err = sshMasterNode.Executef("echo \"%s\" > /tmp/%s.yaml", app.ValueFileContent, app.ChartName)
		if err != nil {
			return err
		}
		if executionResult.IsError() {
			return executionResult.Error()
		}
		valuesFileCmd = fmt.Sprintf("-f /tmp/%s.yaml", app.ChartName)
	}

	installCommand := fmt.Sprintf("sudo microk8s.helm3 upgrade --install --create-namespace -n%s %s %s %s",
		app.Namespace, app.ReleaseName, app.ChartName+"/"+app.ChartName, valuesFileCmd)
	if len(app.Version) > 0 {
		installCommand += " --version " + app.Version
	}
	if app.Wait {
		installCommand += " --wait"
	}
	executionResult, err = sshMasterNode.Executef(installCommand)
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}

	if len(app.ValueFileContent) > 0 {
		executionResult, err = sshMasterNode.Executef("sudo rm /tmp/%s.yaml", app.ChartName)
		if err != nil {
			return err
		}
		if executionResult.IsError() {
			return executionResult.Error()
		}
	}

	return nil
}
