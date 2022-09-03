package ssh

import (
	"bytes"
	"errors"
	"fmt"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/ssh"
)

func NewClient() *Client {
	return &Client{}
}

func NewClientWithKey(username string, rsaKeyPair RsaKeyPair, host string) *Client {
	return &Client{
		username:   username,
		password:   "",
		rsaKeyPair: &rsaKeyPair,
		host:       host,
	}
}

type Client struct {
	username   string
	password   string
	rsaKeyPair *RsaKeyPair
	host       string
}

func (p *Client) SetConnectionData(username string, password string, host string) {
	p.username = username
	p.password = password
	p.host = host
}

func (p *Client) ClearConnectionData() {
	p.username = ""
	p.password = ""
	p.host = ""
}

func (p *Client) Executef(command string, a ...any) (ExecutionResult, error) {
	return p.Execute(fmt.Sprintf(command, a...))
}

func (p *Client) Execute(command string) (ExecutionResult, error) {
	var config *ssh.ClientConfig
	if p.rsaKeyPair == nil {
		config = &ssh.ClientConfig{
			User: p.username,
			Auth: []ssh.AuthMethod{
				ssh.Password(p.password),
			},
			HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		}
	} else {
		// create signer
		signer, err := ssh.ParsePrivateKey(p.rsaKeyPair.PrivateKey)
		if err != nil {
			return ExecutionResult{}, err
		}

		config = &ssh.ClientConfig{
			User: p.username,
			Auth: []ssh.AuthMethod{
				ssh.PublicKeys(signer),
			},
			HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		}
	}
	// connect to ssh server
	conn, err := ssh.Dial("tcp", p.host+":22", config)
	if err != nil {
		return ExecutionResult{}, err
	}
	// Session
	session, err := conn.NewSession()
	if err != nil {
		return ExecutionResult{}, err
	}
	defer func() {
		err := session.Close()
		if err != nil {
			log.WithError(err).Error("cannot close session")
		}
		err = conn.Close()
		if err != nil {
			log.WithError(err).Error("cannot close connection")
		}
	}()

	//Run command
	var buffOut bytes.Buffer
	var buffErr bytes.Buffer
	session.Stdout = &buffOut
	session.Stderr = &buffErr

	err = session.Run(command)
	if err != nil {
		errOut := buffErr.String()
		if len(errOut) == 0 {
			errOut = buffOut.String()
		}
		return ExecutionResult{
			Output: buffOut.String(),
			error: &ExecutionError{
				Output: errOut,
				Code:   err.(*ssh.ExitError).ExitStatus(),
			},
		}, nil
	}

	return ExecutionResult{
		Output: buffOut.String(),
	}, nil
}

type ExecutionError struct {
	Output string
	Code   int
}

func (e *ExecutionError) ToError() error {
	return errors.New(fmt.Sprintf("[%d] - %s", e.Code, e.Output))
}

type ExecutionResult struct {
	Output string
	error  *ExecutionError
}

func (r ExecutionResult) Error() error {
	if r.error != nil {
		return r.error.ToError()
	}
	return nil
}

func (r ExecutionResult) Code() int {
	if r.error != nil {
		return r.error.Code
	}
	return 0
}

func (r ExecutionResult) IsError() bool {
	return r.error != nil
}
