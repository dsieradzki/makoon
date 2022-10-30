package management

type ClusterHeader struct {
	Name        string `json:"name"`
	NodesCount  int    `json:"nodesCount"`
	CoresSum    int    `json:"coresSum"`
	MemorySum   int    `json:"memorySum"`
	DiskSizeSum int    `json:"diskSizeSum"`
}

func (s *Service) GetClusters() ([]ClusterHeader, error) {
	result := make([]ClusterHeader, 0)

	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return result, err
	}

	for _, c := range database.Clusters {
		cluster := ClusterHeader{
			Name:        c.ClusterName,
			NodesCount:  len(c.Nodes),
			DiskSizeSum: int(c.NodeDiskSize) * len(c.Nodes),
		}
		for _, n := range c.Nodes {
			cluster.CoresSum += int(n.Cores)
			cluster.MemorySum += int(n.Memory)
		}
		result = append(result, cluster)
	}

	return result, nil
}
