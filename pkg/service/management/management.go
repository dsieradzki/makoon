package management

import (
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/pkg/service/database"
)

func NewService(projectService *database.Service, proxmoxClient *proxmox.Client) *Service {
	return &Service{
		databaseService: projectService,
		proxmoxClient:   proxmoxClient,
	}
}

type Service struct {
	databaseService *database.Service
	proxmoxClient   *proxmox.Client
}
