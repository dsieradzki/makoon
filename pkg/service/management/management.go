package management

import (
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/pkg/service/database"
)

func NewService(
	projectService *database.Service,
	proxmoxClient *proxmox.Client,
	k4pService *k4p.Service) *Service {
	return &Service{
		databaseService: projectService,
		proxmoxClient:   proxmoxClient,
		k4pService:      k4pService,
	}
}

type Service struct {
	databaseService *database.Service
	proxmoxClient   *proxmox.Client
	k4pService      *k4p.Service
}
