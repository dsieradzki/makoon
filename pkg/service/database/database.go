package database

import (
	"context"
	"errors"
	"fmt"
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/sshfs"
	"github.com/goccy/go-yaml"
	log "github.com/sirupsen/logrus"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"os"
	"path"
	"sync"
	"time"
)

const currentSchemaVersion = 1
const defaultRemoteAppDir = "~/k4prox"

type Metadata struct {
	LastUpdate    time.Time `json:"lastUpdate" yaml:"lastUpdate"`
	SchemaVersion uint64    `json:"schemaVersion" yaml:"schemaVersion"`
}
type DatabaseData struct {
	Metadata Metadata      `json:"metadata" yaml:"metadata"`
	Clusters []k4p.Cluster `json:"clusters" yaml:"clusters"`
}

func (d *DatabaseData) FindClusterByName(name string) (k4p.Cluster, error) {
	for _, v := range d.Clusters {
		if v.ClusterName == name {
			return v, nil
		}
	}
	return k4p.Cluster{}, errors.New("not found")
}

func NewService(proxmoxClient *proxmox.Client, proxmoxSsh *ssh.Client) *Service {
	return &Service{
		proxmoxClient: proxmoxClient,
		proxmoxSsh:    proxmoxSsh,
	}
}

type Service struct {
	ctx               context.Context
	proxmoxClient     *proxmox.Client
	proxmoxSsh        *ssh.Client
	saveDatabaseMutex sync.Mutex
}

func (p *Service) SetContext(ctx context.Context) {
	p.ctx = ctx
}

func (p *Service) IsFirstRunOfApp() (bool, error) {
	remoteFs := sshfs.Create(p.proxmoxSsh)
	isExists, err := remoteFs.IsExists(getDatabaseFileName())
	if err != nil {
		log.WithError(err).Error("Cannot check k4prox data on Proxmox")
	}
	return !isExists, err
}

func (p *Service) AcceptAndSetupApp() error {
	err := p.initNewDatabaseIfNotExists()
	if err != nil {
		log.WithError(err).Error("Cannot init k4prox on Proxmox")
	}
	return err
}

func (p *Service) SaveKubeConfigDialog(clusterName string) error {
	kubeConfigFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "config",
		Title:            "Save Kubernetes config",
	})
	if err != nil {
		log.WithError(err).Error("Cannot save Kubernetes config")
		return err
	}

	database, err := p.LoadDatabase()
	if err != nil {
		log.WithError(err).Error("Cannot load database")
		return err
	}

	file, err := os.Create(kubeConfigFileName)
	if err != nil {
		log.WithError(err).Error("Cannot create Kubernetes config file")
		return err
	}
	defer file.Close()

	for _, v := range database.Clusters {
		if v.ClusterName == clusterName {
			_, err = file.Write([]byte(v.KubeConfig))
			if err != nil {
				log.WithError(err).Error("Cannot write to Kuberetes config file")
			}
			_ = file.Sync()
			return err
		}
	}
	log.Error("Cluster not found")
	return errors.New("cluster not found")
}

func (p *Service) SaveSshPrivateKeyDialog(clusterName string) error {
	kubeConfigFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "cluster_key.pem",
		Title:            "Save SSH private key",
	})
	if err != nil {
		log.WithError(err).Error("Cannot save ssh private key")
		return err
	}

	database, err := p.LoadDatabase()
	if err != nil {
		log.WithError(err).Error("Cannot load database")
		return err
	}

	file, err := os.Create(kubeConfigFileName)
	if err != nil {
		log.WithError(err).Error("Cannot create private key file")
		return err
	}
	defer file.Close()

	for _, v := range database.Clusters {
		if v.ClusterName == clusterName {
			_, err = file.Write(v.SshKey.PrivateKey)
			if err != nil {
				log.WithError(err).Error("Cannot write private key to file")
			}
			_ = file.Sync()
			return err
		}
	}
	log.Error("Cluster not found")
	return errors.New("cluster not found")
}

func (p *Service) SaveSshAuthorizationKeyDialog(clusterName string) error {
	kubeConfigFileName, err := runtime.SaveFileDialog(p.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: getHomeDir(),
		DefaultFilename:  "cluster_key.txt",
		Title:            "Save SSH authorization key",
	})
	if err != nil {
		log.WithError(err).Error("Cannot save ssh private key")
		return err
	}

	database, err := p.LoadDatabase()
	if err != nil {
		log.WithError(err).Error("Cannot load database")
		return err
	}

	file, err := os.Create(kubeConfigFileName)
	if err != nil {
		log.WithError(err).Error("Cannot create authorization	key file")
		return err
	}
	defer file.Close()
	for _, v := range database.Clusters {
		if v.ClusterName == clusterName {
			_, err = file.Write(v.SshKey.PublicKey)
			log.WithError(err).Error("Cannot write authorization key to file")
			_ = file.Sync()
			return err
		}
	}
	log.Error("Cluster not found")
	return errors.New("cluster not found")
}

func (p *Service) LoadCluster(clusterName string) (k4p.Cluster, error) {
	db, err := p.LoadDatabase()
	if err != nil {
		log.WithError(err).Error("Cannot load database")
		return k4p.Cluster{}, err
	}
	return db.FindClusterByName(clusterName)
}

func (p *Service) SaveDatabase(databaseToSave DatabaseData) error {
	p.saveDatabaseMutex.Lock()
	defer p.saveDatabaseMutex.Unlock()

	currentDatabase, err := p.LoadDatabase()
	if err != nil {
		log.WithError(err).Error("Cannot load database")
		return err
	}

	if currentDatabase.Metadata.SchemaVersion != currentSchemaVersion {
		return errors.New(fmt.Sprintf("Schema version mismatch, database file version [%d] and current version [%d]", currentDatabase.Metadata.SchemaVersion, currentSchemaVersion))
	}

	if !currentDatabase.Metadata.LastUpdate.Equal(databaseToSave.Metadata.LastUpdate) {
		return errors.New("to prevent data loss, database cannot be saved because last modification time not match")
	}

	databaseToSave.Metadata.LastUpdate = time.Now()

	return p.saveDatabaseFile(databaseToSave)
}

func (p *Service) initNewDatabaseIfNotExists() error {
	remoteFs := sshfs.Create(p.proxmoxSsh)
	isExists, err := remoteFs.IsExists(defaultRemoteAppDir)
	if err != nil {
		log.WithError(err).Error("Cannot check that app dir exists on Proxmox")
		return err
	}
	if !isExists {
		err := remoteFs.CreateDirectory(defaultRemoteAppDir)
		if err != nil {
			log.WithError(err).Error("Cannot create app dir on Proxmox")
			return err
		}
		err = p.saveDatabaseFile(DatabaseData{
			Metadata: Metadata{
				LastUpdate:    time.Now(),
				SchemaVersion: currentSchemaVersion,
			},
		})
		if err != nil {
			log.WithError(err).Error("Cannot create app database file on Proxmox")
		}
		return err
	}
	return nil
}

func (p *Service) LoadDatabase() (DatabaseData, error) {
	remoteDatabaseFile := sshfs.Create(p.proxmoxSsh)
	projectFileData, err := remoteDatabaseFile.ReadFile(getDatabaseFileName())
	if err != nil {
		log.WithError(err).Error("Cannot read database file from Proxmox")
		return DatabaseData{}, err
	}

	var project DatabaseData
	err = yaml.Unmarshal(projectFileData, &project)
	if err != nil {
		log.WithError(err).Error("cannot read projects")
	}
	return project, err
}

func (p *Service) saveDatabaseFile(database DatabaseData) error {
	projectData, err := yaml.Marshal(&database)
	if err != nil {
		log.WithError(err).Error("cannot save projects")
		return err
	}
	file := sshfs.Create(p.proxmoxSsh)
	err = file.Write(getDatabaseFileName(), projectData)
	if err != nil {
		log.WithError(err).Error("Cannot write database file")
	}
	return err
}

func getDatabaseFileName() string {
	return path.Join(defaultRemoteAppDir, "k4prox-db.yaml")
}

func getHomeDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return home
}
