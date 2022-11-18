package management

import (
	"encoding/json"
	"errors"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/ssh"
	log "github.com/sirupsen/logrus"
	"sync"
	"time"
)

type VmStatus string
type K8sStatus string

var (
	VmUp   VmStatus = "up"
	VmDown VmStatus = "down"

	K8sReady    K8sStatus = "ready"
	K8SNotReady K8sStatus = "not_ready"
	K8SUnknown  K8sStatus = "unknown"
)

type NodeStatus struct {
	Vmid      uint32    `json:"vmid"`
	VmStatus  VmStatus  `json:"vmStatus"`
	K8sStatus K8sStatus `json:"k8SStatus"`
}

const sshTimeout = 10 * time.Second
const checkK8sNodesTimeout = "30s"

func (s *Service) GetNodesStatus(clusterName string) ([]NodeStatus, error) {
	databaseData, err := s.databaseService.LoadDatabase()
	if err != nil {
		return nil, err
	}
	cluster, err := databaseData.FindClusterByName(clusterName)
	if err != nil {
		return nil, err
	}
	vmsStatus := getVmsStatus(cluster)
	status := getK8sStatus(cluster, vmsStatus)
	return status, nil
}

func getVmsStatus(cluster k4p.Cluster) []NodeStatus {
	var result = make([]NodeStatus, 0)
	resultMutex := sync.Mutex{}
	wg := sync.WaitGroup{}
	wg.Add(len(cluster.Nodes))

	for _, v := range cluster.Nodes {
		go func(node k4p.KubernetesNode) {
			log.Debugf("Get status for VM [%s]", node.Name(cluster.ClusterName))
			client := ssh.
				NewClientWithKey(cluster.NodeUsername, cluster.SshKey, node.IpAddress).
				WithTimeout(sshTimeout)

			vmStatus := VmDown
			executeRes, err := client.Execute("time")
			if err != nil {
				log.Error(err)
				vmStatus = VmDown
			}
			if executeRes.IsError() {
				log.Error(executeRes.Error())
				vmStatus = VmDown
			}
			if err == nil && !executeRes.IsError() {
				vmStatus = VmUp
			}
			resultMutex.Lock()
			result = append(result, NodeStatus{
				Vmid:      node.Vmid,
				VmStatus:  vmStatus,
				K8sStatus: K8SUnknown,
			})
			resultMutex.Unlock()
			wg.Done()
		}(v)
	}
	wg.Wait()
	log.Debugf("Vms status %v", result)
	return result
}

func getK8sStatus(cluster k4p.Cluster, inputStatus []NodeStatus) []NodeStatus {
	masterNodes := collect.Filter(cluster.Nodes, func(n k4p.KubernetesNode) bool {
		if n.NodeType != k4p.Master {
			return false
		}

		for _, v := range inputStatus {
			if v.Vmid == n.Vmid && v.VmStatus == VmUp {
				return true
			}
		}
		return false
	})

	if len(masterNodes) == 0 {
		log.Debug("There is no working master nodes")
		return inputStatus
	}
	workingMasterNode := masterNodes[0]

	log.WithField("node", workingMasterNode.Name(cluster.ClusterName)).Debug("Selected working master node VM")

	client := ssh.
		NewClientWithKey(cluster.NodeUsername, cluster.SshKey, workingMasterNode.IpAddress).
		WithTimeout(sshTimeout)

	executeResult, err := client.Executef("sudo microk8s kubectl get nodes -o json --request-timeout='%s'", checkK8sNodesTimeout)
	if err != nil {
		log.WithError(err).Error("Cannot execute [kubectl get nodes]")
		return inputStatus
	}
	if executeResult.IsError() {
		log.WithError(executeResult.Error()).Error("Command [kubectl get nodes] return with error")
		return inputStatus
	}
	var kubectlResponse map[string]interface{}
	err = json.Unmarshal([]byte(executeResult.Output), &kubectlResponse)
	if err != nil {
		log.WithError(err).WithField("response", executeResult.Output).Error("Cannot unmarshall nodes status response")
		return inputStatus
	}
	nodesStatus, err := extractReadyStatusForNodes(kubectlResponse)
	if err != nil {
		log.WithError(err).Error("Cannot extract node status from response")
		return inputStatus
	}

	for i := 0; i < len(inputStatus); i++ {
		nodeName := findNameForVmId(cluster, inputStatus[i].Vmid)
		nodeStatus := nodesStatus[nodeName]
		log.Debugf("Node [%s] is ready: [%s]", nodeName, nodeStatus)

		if nodeStatus == "True" {
			inputStatus[i].K8sStatus = K8sReady
		} else if nodeStatus == "False" {
			inputStatus[i].K8sStatus = K8SNotReady
		} else if nodeStatus == "Unknown" {
			inputStatus[i].K8sStatus = K8SNotReady
		} else {
			inputStatus[i].K8sStatus = K8SUnknown
		}
	}

	return inputStatus
}

func findNameForVmId(cluster k4p.Cluster, vmId uint32) string {
	for _, v := range cluster.Nodes {
		if v.Vmid == vmId {
			return v.Name(cluster.ClusterName)
		}
	}
	log.Error("cannot find vm name for vm id")
	return ""
}

func extractReadyStatusForNodes(source map[string]interface{}) (map[string]string, error) {
	result := make(map[string]string, 0)
	items, err := getValueFromDataNode(source, []string{"items"})
	if err != nil {
		return result, errors.New("source data doesn't contain [items] key")
	}

	for _, v := range items.([]interface{}) {
		nodeName, err := getValueFromDataNode(v, []string{"metadata", "name"})
		if err != nil {
			if err != nil {
				return result, errors.New("source data doesn't contain [metadata.name] key")
			}
		}
		conditions, err := getValueFromDataNode(v, []string{"status", "conditions"})
		if err != nil {
			if err != nil {
				return result, errors.New("source data doesn't contain [status.conditions] key")
			}
		}
		for _, c := range conditions.([]interface{}) {
			cm, ok := c.(map[string]interface{})
			if !ok {
				return result, errors.New("cannot parse conditions")
			}
			if cm["type"].(string) == "Ready" {
				result[nodeName.(string)] = cm["status"].(string)
				break
			}
		}
	}

	return result, nil
}

func getValueFromDataNode(source interface{}, path []string) (interface{}, error) {
	if len(path) == 0 {
		return source, nil
	}
	switch source.(type) {
	case map[string]interface{}:
		s := source.(map[string]interface{})
		return getValueFromDataNode(s[path[0]], path[1:])
	case []interface{}:
		return source.([]interface{}), nil
	default:
		return nil, errors.New("type not known")
	}
}
