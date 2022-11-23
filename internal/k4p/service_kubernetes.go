package k4p

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/utils/task"
	"time"
)

func (k *Service) InstallKubernetesOnVms(cluster Cluster, keyPair ssh.RsaKeyPair) error {
	hosts := k.generateEntriesForHostsFile(cluster)

	executor := task.NewTaskExecutor[any]()
	for _, node := range cluster.Nodes {
		executor.AddTask(
			context.WithValue(context.Background(), "NODE", node),
			func(c context.Context) (any, error) {
				nodeToInstall := c.Value("NODE").(KubernetesNode)
				return nil, k.installKubernetesOnNode(cluster, nodeToInstall, keyPair, hosts)
			})
	}
	executor.Wait()
	return executor.Results().AnyError()
}

func (k *Service) generateEntriesForHostsFile(cluster Cluster) map[string]string {
	result := make(map[string]string, 0)
	for _, v := range cluster.Nodes {
		result[v.Name(cluster.ClusterName)] = v.IpAddress
	}
	return result
}

func (k *Service) installKubernetesOnNode(provisionRequest Cluster, node KubernetesNode, keyPair ssh.RsaKeyPair, hosts map[string]string) error {
	sshClient := ssh.NewClientWithKey(provisionRequest.NodeUsername, keyPair, node.IpAddress)
	//
	//
	//
	for dns, ip := range hosts {
		if dns == node.Name(provisionRequest.ClusterName) {
			continue
		}
		executionResult, err := sshClient.Executef("echo '%s %s' | sudo tee -a /etc/cloud/templates/hosts.debian.tmpl", ip, dns)
		if err != nil {
			return err
		}
		if executionResult.IsError() {
			return executionResult.Error()
		}
		executionResult, err = sshClient.Executef("echo '%s %s' | sudo tee -a /etc/hosts", ip, dns)
		if err != nil {
			return err
		}
		if executionResult.IsError() {
			return executionResult.Error()
		}
	}
	//
	//
	//
	eventSession := k.eventCollector.StartWithDetails("Install Kubernetes", k.generateVmIdDetails(node.Vmid))
	executionResult, err := sshClient.ExecuteWithOptions(ssh.ExecuteOptions{
		Command:            "sudo snap install microk8s --channel=1.24/stable --classic",
		Retries:            3,
		TimeBetweenRetries: 5 * time.Second,
	})
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return executionResult.Error()
	}
	eventSession.Done()
	//
	//
	//
	eventSession = k.eventCollector.StartWithDetails("Wait for Kubernetes readiness", k.generateVmIdDetails(node.Vmid))
	executionResult, err = sshClient.Execute("sudo microk8s status --wait-ready")
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return executionResult.Error()
	}
	eventSession.Done()
	return nil
}

type JoinNode struct {
	Token string   `json:"token"`
	Urls  []string `json:"urls"`
}

func (k *Service) JoinNodesToCluster(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	if len(provisionRequest.Nodes) < 2 {
		k.eventCollector.
			Start("No nodes to join").
			Done()
		return nil
	}

	firstNode, nodesToJoin := FindFirstMasterNode(provisionRequest.Nodes)

	sshClientFirstNode := ssh.NewClientWithKey(provisionRequest.NodeUsername, keyPair, firstNode.IpAddress)

	for _, node := range nodesToJoin {
		eventSession := k.eventCollector.StartWithDetails("Generate join token", k.generateVmIdDetails(node.Vmid))
		executionResult, err := sshClientFirstNode.Execute("sudo microk8s add-node --format json")
		if err != nil {
			eventSession.ReportError(err)
			return err
		}
		if executionResult.IsError() {
			eventSession.ReportError(executionResult.Error())
			return executionResult.Error()
		}

		var joinNode JoinNode
		err = json.Unmarshal([]byte(executionResult.Output), &joinNode)
		if err != nil {
			eventSession.ReportError(executionResult.Error())
			return err
		}
		if len(joinNode.Urls) == 0 {
			errNotFound := errors.New("not found any join node tokens")
			eventSession.ReportError(errNotFound)
			return errNotFound

		}
		eventSession.Done()
		//
		//
		//
		sshClientNodeToJoin := ssh.NewClientWithKey(provisionRequest.NodeUsername, keyPair, node.IpAddress)
		//
		//
		//
		eventSession = k.eventCollector.StartWithDetails("Join node to cluster", k.generateVmIdDetails(node.Vmid))
		joinCommand := fmt.Sprintf("sudo microk8s join %s", joinNode.Urls[0])
		if node.NodeType == Worker {
			joinCommand = joinCommand + " --worker"
		}
		executionResult, err = sshClientNodeToJoin.Execute(joinCommand)
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
	return nil
}

func (k *Service) GetKubeConfigFromCluster(clusterDef Cluster, keyPair ssh.RsaKeyPair) (string, error) {
	firstMasterNode, _ := FindFirstMasterNode(clusterDef.Nodes)
	sshMasterNode := ssh.NewClientWithKey(clusterDef.NodeUsername, keyPair, firstMasterNode.IpAddress)
	eventSession := k.eventCollector.Start("Get Kubernetes config from cluster")
	executionResult, err := sshMasterNode.Execute("sudo microk8s config")
	if err != nil {
		eventSession.ReportError(err)
		return "", err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return "", executionResult.Error()
	}
	eventSession.Done()
	return executionResult.Output, nil
}
