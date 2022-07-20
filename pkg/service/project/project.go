package project

import (
	"context"
	"errors"
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/goccy/go-yaml"
	log "github.com/sirupsen/logrus"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"os"
	"sort"
)

var k4proxFilters = []runtime.FileFilter{
	{
		DisplayName: "K4Prox Yaml (*.yaml, *.yml)",
		Pattern:     "*.yml;*.yaml",
	},
}

const maxNumberOfKubeNodeProposal = 20

type ProjectData struct {
	KubeConfig string         `json:"kubeConfig" yaml:"kubeConfig"`
	SshKey     ssh.RsaKeyPair `json:"sshKey" yaml:"sshKey"`
	Cluster    k4p.Cluster    `json:"cluster" yaml:"cluster"`
}

func NewProjectService(proxmoxClient *proxmox.Client) *Service {
	return &Service{
		proxmoxClient: proxmoxClient,
		projectGenerator: &Generator{
			proxmoxClient: proxmoxClient,
		},
	}
}

type Service struct {
	ctx              context.Context
	projectFile      string
	proxmoxClient    *proxmox.Client
	projectGenerator *Generator
}

func (p *Service) SetContext(ctx context.Context) {
	p.ctx = ctx
}

func (p *Service) OpenProjectDialog() (bool, error) {
	projectFileName, err := runtime.OpenFileDialog(p.ctx, runtime.OpenDialogOptions{
		DefaultDirectory: getHomeDir(),
		Title:            "Open K4Prox project file",
		Filters:          k4proxFilters,
	})
	if err != nil {
		return false, err
	}
	if len(projectFileName) == 0 {
		return false, errors.New("file not specified")
	}
	p.projectFile = projectFileName
	project, err := p.LoadProject()
	return len(project.KubeConfig) > 0, err

}

func (p *Service) SaveProjectDialog() (bool, error) {
	projectFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "kubernetes-cluster-1.yaml",
		Title:            "Save K4Prox project file",
		Filters:          k4proxFilters,
	})
	if err != nil {
		return false, err
	}
	if len(projectFileName) == 0 {
		return false, errors.New("file not specified")
	}

	err = p.projectGenerator.GenerateDefaultProject(projectFileName)
	p.projectFile = projectFileName
	return false, err
}

func (p *Service) SaveKubeConfigDialog() error {
	kubeConfigFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "config",
		Title:            "Save Kubernetes config",
		Filters:          k4proxFilters,
	})
	if err != nil {
		return err
	}

	project, err := p.LoadProject()
	if err != nil {
		return err
	}

	file, err := os.Create(kubeConfigFileName)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = file.Write([]byte(project.KubeConfig))
	return err
}

func (p *Service) SaveSshPrivateKeyDialog() error {
	kubeConfigFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "cluster.pem",
		Title:            "Save SSH private key",
	})
	if err != nil {
		return err
	}

	project, err := p.LoadProject()
	if err != nil {
		return err
	}

	file, err := os.Create(kubeConfigFileName)
	if err != nil {
		return err
	}
	defer file.Close()
	if _, err = file.Write(project.SshKey.PrivateKey); err != nil {
		return err
	}
	return file.Sync()
}

func (p *Service) SaveSshAuthorizationKeyDialog() error {
	kubeConfigFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "cluster.txt",
		Title:            "Save SSH authorization key",
	})
	if err != nil {
		return err
	}

	project, err := p.LoadProject()
	if err != nil {
		return err
	}

	file, err := os.Create(kubeConfigFileName)
	if err != nil {
		return err
	}
	defer file.Close()
	if _, err = file.Write(project.SshKey.PublicKey); err != nil {
		return err
	}
	return file.Sync()
}

func (p *Service) LoadProject() (ProjectData, error) {
	projectFileData, err := os.ReadFile(p.projectFile)
	if err != nil {
		return ProjectData{}, err
	}

	var project ProjectData
	err = yaml.Unmarshal(projectFileData, &project)
	if err != nil {
		log.WithError(err).Error("cannot read projects")
	}
	return project, err
}

func (p *Service) SaveProject(project ProjectData) error {
	currentProject, err := p.LoadProject()
	if err != nil {
		return err
	}
	// Safe project saving, to prevent override ssh and kubeconfig
	currentProject.Cluster = project.Cluster
	if len(currentProject.KubeConfig) == 0 {
		currentProject.KubeConfig = project.KubeConfig
	}

	if currentProject.SshKey.Empty() {
		currentProject.SshKey.PrivateKey = project.SshKey.PrivateKey
		currentProject.SshKey.PublicKey = project.SshKey.PublicKey
	}

	sort.Slice(currentProject.Cluster.Nodes, func(i, j int) bool {
		return currentProject.Cluster.Nodes[i].Vmid < currentProject.Cluster.Nodes[j].Vmid
	})

	return saveProject(p.projectFile, currentProject)
}

func saveProject(fileName string, defaultProject ProjectData) error {
	projectData, err := yaml.Marshal(&defaultProject)
	if err != nil {
		log.WithError(err).Error("cannot save projects")
		return err
	}
	file, err := os.Create(fileName)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(projectData)
	return err
}

func getHomeDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return home
}
