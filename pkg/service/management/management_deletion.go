package management

import (
	"context"
	"errors"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/utils"
	"github.com/dsieradzki/k4prox/internal/utils/task"
	log "github.com/sirupsen/logrus"
	"time"
)

func (s *Service) DeleteCluster(clusterName string) error {
	database, err := s.databaseService.LoadDatabase()
	if err != nil {
		return err
	}

	cluster, err := database.FindClusterByName(clusterName)
	if err != nil {
		return err
	}
	log.Info("Requesting to stop all VM's")
	executor := task.NewTaskExecutor[any]()
	vms, err := s.proxmoxClient.GetVMs()
	if err != nil {
		return err
	}

	isVmNotExists := func(vmid uint32) bool {
		_, notFoundErr := collect.FindAny(vms, func(e proxmox.GetVMsResponse) bool {
			return e.Vmid == vmid
		})
		return notFoundErr != nil
	}

	for _, n := range cluster.Nodes {
		executor.AddTask(
			context.WithValue(context.Background(), "NODE", n),
			func(c context.Context) (any, error) {
				node := c.Value("NODE").(k4p.KubernetesNode)

				if isVmNotExists(node.Vmid) {
					log.Warnf("Cannot stop VM [%d], because is not exists", node.Vmid)
					return nil, nil
				}
				err := s.proxmoxClient.StopVM(node.Vmid)
				if err != nil {
					return nil, err
				}

				err = utils.Retry(30, 10*time.Second,
					func(attempt uint) error {
						log.Infof("waiting for shutdown [%d] VM, attempt [%d]", node.Vmid, attempt)
						vmStatus, err := s.proxmoxClient.CurrentVMStatus(node.Vmid)
						if err != nil {
							return err // Happens only on Proxmox API error
						}
						if vmStatus == proxmox.VmStatusStopped {
							return nil
						} else {
							return errors.New("VM is still running")
						}
					})
				return nil, err
			})
	}
	executor.Wait()

	if executor.Results().AnyError() != nil {
		log.WithError(executor.Results().AnyError()).Error("Cannot stop VM's")
		return executor.Results().AnyError()
	}
	log.Info("All VM's has been stopped")

	log.Info("Deleting VM's")
	executor = task.NewTaskExecutor[any]()
	for _, n := range cluster.Nodes {
		executor.AddTask(
			context.WithValue(context.Background(), "NODE", n),
			func(c context.Context) (any, error) {
				node := c.Value("NODE").(k4p.KubernetesNode)

				if isVmNotExists(node.Vmid) {
					log.Warnf("Cannot delete VM [%d], because is not exists", node.Vmid)
					return nil, nil
				}
				return nil, s.proxmoxClient.DeleteVM(node.Vmid)
			})
	}
	executor.Wait()
	if executor.Results().AnyError() != nil {
		log.WithError(executor.Results().AnyError()).Error("Cannot delete VM's")
		return executor.Results().AnyError()
	}
	log.Info("All VM's has been deleted")

	database, err = s.databaseService.LoadDatabase()
	if err != nil {
		return err
	}

	database.Clusters = collect.Filter(database.Clusters, func(c k4p.Cluster) bool {
		return c.ClusterName != clusterName
	})
	err = s.databaseService.SaveDatabase(database)
	if err != nil {
		log.WithError(err).Error("Cannot update database")
		return err
	}
	log.Info("Database saved")
	log.Info("Cluster has been deleted")
	return nil
}
