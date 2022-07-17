package service

import (
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
)

func NewLoginService(api *proxmox.Client, ssh *ssh.Client) *LoginService {
	return &LoginService{
		api: api,
		ssh: ssh,
	}
}

type LoginService struct {
	api *proxmox.Client
	ssh *ssh.Client
}

func (l *LoginService) Login(username string, password string, host string) error {
	l.ssh.SetConnectionData(username, password, host)
	return l.api.LoginToProxmox(username, password, host, 8006)
}
