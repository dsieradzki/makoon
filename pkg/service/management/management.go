package management

import (
	"github.com/dsieradzki/k4prox/pkg/service/project"
)

func NewService(projectService *project.Service) *Service {
	return &Service{
		projectService: projectService,
	}
}

type Service struct {
	projectService *project.Service
}
