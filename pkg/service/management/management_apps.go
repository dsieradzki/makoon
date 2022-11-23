package management

import (
	"encoding/json"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

type HelmAppStatus struct {
	Id     string `json:"id"`
	Status string `json:"status"`
}

type InstalledChart struct {
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Revision   string `json:"revision"`
	Updated    string `json:"updated"` // There is a format problem with parsing to time.Time, currently field is not used to can be string for now
	Status     string `json:"status"`
	Chart      string `json:"chart"`
	AppVersion string `json:"app_version"`
}

func (s *Service) GetHelpAppsStatus(clusterName string) ([]HelmAppStatus, error) {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return nil, err
	}

	cluster, err := collect.FindAny(database.Clusters, func(e k4p.Cluster) bool { return e.ClusterName == clusterName })
	if err != nil {
		return nil, err
	}
	masterNode, _ := k4p.FindFirstMasterNode(cluster.Nodes)

	connection := ssh.NewClientWithKey(cluster.NodeUsername, cluster.SshKey, masterNode.IpAddress)

	// Get list of installed Helm Charts
	executionResult, err := connection.Execute("sudo microk8s helm3 list -A -o json")
	if err != nil {
		log.WithError(err).Error("Cannot get list of deployed charts")
		return returnUnknownStatuses(cluster)
	}
	if executionResult.IsError() {
		log.WithError(err).Error("Cannot get list of deployed charts")
		return returnUnknownStatuses(cluster)
	}
	installedHelmCharts := make([]InstalledChart, 0)
	err = json.Unmarshal([]byte(executionResult.Output), &installedHelmCharts)
	if err != nil {
		log.WithError(err).WithField("output", executionResult.Output).Error("Cannot unmarshall result from helm")
		return nil, err
	}

	// Find all charts defined in project and get its status
	result := make([]HelmAppStatus, 0)
	for _, v := range cluster.HelmApps {
		app, err := collect.FindAny(installedHelmCharts, func(e InstalledChart) bool {
			return e.Name == v.ReleaseName && e.Namespace == v.Namespace
		})

		status := "not_installed"
		if err == nil {
			status = app.Status
		}
		result = append(result, HelmAppStatus{
			Id:     v.Id,
			Status: status,
		})
	}
	return result, nil
}

func returnUnknownStatuses(cluster k4p.Cluster) ([]HelmAppStatus, error) {
	result := make([]HelmAppStatus, 0)
	for _, v := range cluster.HelmApps {
		result = append(result, HelmAppStatus{
			Id:     v.Id,
			Status: "unknown",
		})
	}
	return result, nil
}

func (s *Service) AddHelmChart(clusterName string, req k4p.HelmApp) (string, error) {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return "", err
	}

	id := uuid.New().String()
	for c := 0; c < len(database.Clusters); c++ {
		if database.Clusters[c].ClusterName == clusterName {
			database.Clusters[c].HelmApps = append(database.Clusters[c].HelmApps, k4p.HelmApp{
				Id:               id,
				ChartName:        req.ChartName,
				Version:          req.Version,
				Wait:             req.Wait,
				Repository:       req.Repository,
				ReleaseName:      req.ReleaseName,
				Namespace:        req.Namespace,
				ValueFileContent: req.ValueFileContent,
			})
		}
	}

	return id, s.databaseService.SaveDatabase(database)
}
func (s *Service) UpdateHelmChartData(clusterName string, req k4p.HelmApp) error {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return err
	}

	for c := 0; c < len(database.Clusters); c++ {
		if database.Clusters[c].ClusterName == clusterName {
			for h := 0; h < len(database.Clusters[c].HelmApps); h++ {
				if database.Clusters[c].HelmApps[h].Id == req.Id {
					appToUpdate := &database.Clusters[c].HelmApps[h]
					appToUpdate.Version = req.Version
					appToUpdate.Wait = req.Wait
					appToUpdate.ReleaseName = req.ReleaseName
					appToUpdate.ChartName = req.ChartName
					appToUpdate.Namespace = req.Namespace
					appToUpdate.Repository = req.Repository
					appToUpdate.ValueFileContent = req.ValueFileContent
					break
				}
			}
		}
	}

	return s.databaseService.SaveDatabase(database)
}

func (s *Service) InstallHelmChart(clusterName string, id string) error {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return err
	}

	cluster, err := collect.FindAny(database.Clusters, func(e k4p.Cluster) bool { return e.ClusterName == clusterName })
	if err != nil {
		return err
	}

	helmApp, err := collect.FindAny(cluster.HelmApps, func(a k4p.HelmApp) bool {
		return a.Id == id
	})
	if err != nil {
		return err
	}
	masterNode, _ := k4p.FindFirstMasterNode(cluster.Nodes)
	connection := ssh.NewClientWithKey(cluster.NodeUsername, cluster.SshKey, masterNode.IpAddress)
	return s.k4pService.InstallHelmApp(helmApp, connection)
}

func (s *Service) UninstallHelmChart(clusterName string, id string) error {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return err
	}

	cluster, err := collect.FindAny(database.Clusters, func(e k4p.Cluster) bool { return e.ClusterName == clusterName })
	if err != nil {
		return err
	}

	helmApp, err := collect.FindAny(cluster.HelmApps, func(a k4p.HelmApp) bool {
		return a.Id == id
	})
	if err != nil {
		return err
	}
	masterNode, _ := k4p.FindFirstMasterNode(cluster.Nodes)

	connection := ssh.NewClientWithKey(cluster.NodeUsername, cluster.SshKey, masterNode.IpAddress)
	return s.k4pService.UninstallHelmApp(helmApp, connection)
}

func (s *Service) DeleteHelmChart(clusterName string, id string) error {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return err
	}
	for i := 0; i < len(database.Clusters); i++ {
		if database.Clusters[i].ClusterName == clusterName {
			database.Clusters[i].HelmApps = collect.Filter(database.Clusters[i].HelmApps, func(e k4p.HelmApp) bool {
				return e.Id != id
			})
		}
	}

	return s.databaseService.SaveDatabase(database)
}

func (s *Service) AddK8sResource(clusterName string, req k4p.K8sResource) (string, error) {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return "", err
	}

	id := uuid.New().String()
	for c := 0; c < len(database.Clusters); c++ {
		if database.Clusters[c].ClusterName == clusterName {
			database.Clusters[c].K8sResources = append(database.Clusters[c].K8sResources, k4p.K8sResource{
				Id:      id,
				Name:    req.Name,
				Content: req.Content,
			})
		}
	}

	return id, s.databaseService.SaveDatabase(database)
}

func (s *Service) UpdateK8sResourcesData(clusterName string, req k4p.K8sResource) error {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return err
	}

	for c := 0; c < len(database.Clusters); c++ {
		if database.Clusters[c].ClusterName == clusterName {
			for h := 0; h < len(database.Clusters[c].HelmApps); h++ {
				if database.Clusters[c].K8sResources[h].Id == req.Id {
					appToUpdate := &database.Clusters[c].K8sResources[h]
					appToUpdate.Name = req.Name
					appToUpdate.Content = req.Content
					break
				}
			}
		}
	}

	return s.databaseService.SaveDatabase(database)
}

func (s *Service) InstallK8sResource(clusterName string, id string) error {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return err
	}

	cluster, err := collect.FindAny(database.Clusters, func(e k4p.Cluster) bool { return e.ClusterName == clusterName })
	if err != nil {
		return err
	}

	k8sResource, err := collect.FindAny(cluster.K8sResources, func(a k4p.K8sResource) bool {
		return a.Id == id
	})
	if err != nil {
		return err
	}
	masterNode, _ := k4p.FindFirstMasterNode(cluster.Nodes)
	connection := ssh.NewClientWithKey(cluster.NodeUsername, cluster.SshKey, masterNode.IpAddress)
	return s.k4pService.ApplyK8sResource(k8sResource, connection)
}

func (s *Service) UninstallK8sResource(clusterName string, id string) error {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return err
	}

	cluster, err := collect.FindAny(database.Clusters, func(e k4p.Cluster) bool { return e.ClusterName == clusterName })
	if err != nil {
		return err
	}

	k8sResource, err := collect.FindAny(cluster.K8sResources, func(a k4p.K8sResource) bool {
		return a.Id == id
	})
	if err != nil {
		return err
	}
	masterNode, _ := k4p.FindFirstMasterNode(cluster.Nodes)

	connection := ssh.NewClientWithKey(cluster.NodeUsername, cluster.SshKey, masterNode.IpAddress)
	return s.k4pService.DeleteK8sResource(k8sResource, connection)
}

func (s *Service) DeleteK8sResource(clusterName string, id string) error {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return err
	}
	for i := 0; i < len(database.Clusters); i++ {
		if database.Clusters[i].ClusterName == clusterName {
			database.Clusters[i].K8sResources = collect.Filter(database.Clusters[i].K8sResources, func(e k4p.K8sResource) bool {
				return e.Id != id
			})
		}
	}

	return s.databaseService.SaveDatabase(database)
}
