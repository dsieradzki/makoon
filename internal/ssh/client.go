package ssh

import (
	"bytes"
	"errors"
	"fmt"
	"golang.org/x/crypto/ssh"
	"time"
)

func NewSshClient() *Client {
	return &Client{}
}

func NewSshClientKey(username string, rsaKeyPair RsaKeyPair, host string) *Client {
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
			Timeout:         10 * time.Minute,
			HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		}
	}
	// connect to ssh server
	conn, err := ssh.Dial("tcp", p.host+":22", config)
	if err != nil {
		return ExecutionResult{}, err
	}
	defer conn.Close()

	// Session
	session, err := conn.NewSession()
	if err != nil {
		return ExecutionResult{}, err
	}
	defer session.Close()

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

func (r *ExecutionResult) Error() error {
	if r.error != nil {
		return r.error.ToError()
	}
	return nil
}

func (r *ExecutionResult) Code() int {
	if r.error != nil {
		return r.error.Code
	}
	return 0
}

func (r ExecutionResult) IsError() bool {
	return r.error != nil
}
