package auth

import (
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
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
	return l.api.Login(username, password, host, 8006)
}

func (l *Service) EncodeUsingBCrypt(pass string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	res := string(hash)
	return res, err
}
