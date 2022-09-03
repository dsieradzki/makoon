package auth

import (
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

func NewService(api *proxmox.Client, ssh *ssh.Client) *Service {
	return &Service{
		api: api,
		ssh: ssh,
	}
}

type Service struct {
	api *proxmox.Client
	ssh *ssh.Client
}

func (l *Service) Login(username string, password string, host string) error {
	l.ssh.SetConnectionData(username, password, host)
	err := l.api.Login(username, password, host, 8006)
	if err != nil {
		log.Error("Cannot login to Proxmox")
	}
	return err
}

func (l *Service) Logout() {
	l.ssh.ClearConnectionData()
	l.api.ClearLoginData()
}

func (l *Service) GetProxmoxIp() string {
	return l.api.GetProxmoxHost()
}

func (l *Service) EncodeUsingBCrypt(pass string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	res := string(hash)
	return res, err
}
