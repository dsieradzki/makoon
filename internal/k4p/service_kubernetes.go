package k4p

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/utils/task"
	"math"
	"strings"
)

func (k *Service) InstallKubernetesOnNodes(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	executor := task.NewTaskExecutor[any]()
	for _, node := range provisionRequest.Nodes {
		executor.AddTask(
			context.WithValue(context.Background(), "NODE", node),
			func(c context.Context) (any, error) {
				nodeToInstall := c.Value("NODE").(KubernetesNode)
				return nil, k.installKubernetesOnNode(provisionRequest, nodeToInstall, keyPair)
			})
	}
	executor.Wait()
	return executor.Results().AnyError()
}
func (k *Service) installKubernetesOnNode(provisionRequest Cluster, node KubernetesNode, keyPair ssh.RsaKeyPair) error {
	sshClient := ssh.NewSshClientKey(provisionRequest.NodeUsername, keyPair, node.IpAddress)
	//
	//
	//
	eventSession := k.eventCollector.Startf("[VM%d] Install Kubernetes", node.Vmid)
	executionResult, err := sshClient.Execute("sudo snap install microk8s --classic")
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return err
	}
	eventSession.Done()
	//
	//
	//
	eventSession = k.eventCollector.Startf("[VM%d] Wait for Kubernetes readiness", node.Vmid)
	executionResult, err = sshClient.Execute("sudo microk8s status --wait-ready")
	if err != nil {
		eventSession.ReportError(err)
		return err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return err
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

	firstNode, nodesToJoin := findFirstMasterNode(provisionRequest.Nodes)

	sshClientFirstNode := ssh.NewSshClientKey(provisionRequest.NodeUsername, keyPair, firstNode.IpAddress)

	for _, node := range nodesToJoin {
		eventSession := k.eventCollector.Startf("[VM%d] Generate join token", node.Vmid)
		executionResult, err := sshClientFirstNode.Execute("sudo microk8s add-node --format json")
		if err != nil {
			eventSession.ReportError(err)
			return err
		}
		if executionResult.IsError() {
			eventSession.ReportError(executionResult.Error())
			return err
		}

		var joinNode JoinNode
		err = json.Unmarshal([]byte(executionResult.Output), &joinNode)
		if err != nil {
			eventSession.ReportError(executionResult.Error())
			return err
		}
		if len(joinNode.Urls) == 0 {
			eventSession.ReportError(errors.New("not found join node tokens"))
			return err

		}
		eventSession.Done()
		//
		//
		//
		sshClientNodeToJoin := ssh.NewSshClientKey(provisionRequest.NodeUsername, keyPair, node.IpAddress)
		//
		//
		//
		eventSession = k.eventCollector.Startf("[VM%d] Join node to cluster", node.Vmid)
		executionResult, err = sshClientFirstNode.Executef("echo '%s %s' | sudo tee -a /etc/hosts", node.IpAddress, node.Name)
		if err != nil {
			eventSession.ReportError(err)
			return err
		}
		if executionResult.IsError() {
			eventSession.ReportError(executionResult.Error())
			return err
		}

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
			return err
		}
		eventSession.Done()
	}
	return nil
}

func (k *Service) InstallFeatures(provisionRequest Cluster, keyPair ssh.RsaKeyPair) error {
	firstMasterNode, _ := findFirstMasterNode(provisionRequest.Nodes)
	sshMasterNode := ssh.NewSshClientKey(provisionRequest.NodeUsername, keyPair, firstMasterNode.IpAddress)

	featureNameList := collect.Map(provisionRequest.Features, func(f Feature) string { return f.Name })

	featureList := strings.Join(featureNameList, ", ")
	details := fmt.Sprintf("Features: %s", featureList)

	eventSession := k.eventCollector.StartWithDetails("Enable features", details)

	for _, feature := range provisionRequest.Features {
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

		if len(feature.KubernetesObjectDefinition) > 0 {
			executionResult, err = sshMasterNode.Executef("echo \"%s\" > /tmp/%s.yaml", feature.KubernetesObjectDefinition, feature.Name)
			if err != nil {
				eventSession.ReportError(err)
				return err
			}
			if executionResult.IsError() {
				eventSession.ReportError(executionResult.Error())
				return err
			}
			executionResult, err = sshMasterNode.Executef("sudo microk8s.kubectl apply -f /tmp/%s.yaml", feature.Name)
			if err != nil {
				eventSession.ReportError(err)
				return err
			}
			if executionResult.IsError() {
				eventSession.ReportError(executionResult.Error())
				return err
			}
			executionResult, err = sshMasterNode.Executef("sudo rm /tmp/%s.yaml", feature.Name)
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
	eventSession.Done()
	return nil
}

func (k *Service) GetKubeConfigFromCluster(clusterDef Cluster, keyPair ssh.RsaKeyPair) (string, error) {
	firstMasterNode, _ := findFirstMasterNode(clusterDef.Nodes)
	sshMasterNode := ssh.NewSshClientKey(clusterDef.NodeUsername, keyPair, firstMasterNode.IpAddress)
	eventSession := k.eventCollector.Start("Get KubeConfig from cluster")
	executionResult, err := sshMasterNode.Execute("sudo microk8s config")
	if err != nil {
		eventSession.ReportError(err)
		return "", err
	}
	if executionResult.IsError() {
		eventSession.ReportError(executionResult.Error())
		return "", err
	}
	eventSession.Done()
	return executionResult.Output, nil
}

func findFirstMasterNode(nodes []KubernetesNode) (KubernetesNode, []KubernetesNode) {
	firstMasterNode := KubernetesNode{
		Vmid: math.MaxUint16,
	}

	// Find first Master node
	for _, v := range nodes {
		if v.NodeType == Master && v.Vmid < firstMasterNode.Vmid {
			firstMasterNode = v
		}
	}

	// Filter out other nodes
	nodesToJoin := make([]KubernetesNode, 0)
	for _, v := range nodes {
		if v.Vmid != firstMasterNode.Vmid {
			nodesToJoin = append(nodesToJoin, v)
		}
	}
	return firstMasterNode, nodesToJoin
}
