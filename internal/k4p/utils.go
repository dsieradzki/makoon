package k4p

import "math"

func FindFirstMasterNode(nodes []KubernetesNode) (KubernetesNode, []KubernetesNode) {
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
