package ssh

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/dsieradzki/k4prox/internal/utils"
	log "github.com/sirupsen/logrus"
	"golang.org/x/crypto/ssh"
	"io"
	"time"
)

func NewClient() *Client {
	return &Client{}
}

type ExecuteOptions struct {
	Command            string
	Stdin              io.Reader
	Retries            uint
	TimeBetweenRetries time.Duration
}

func NewClientWithKey(username string, rsaKeyPair RsaKeyPair, host string) *Client {
	return &Client{
		username:   username,
		password:   "",
		rsaKeyPair: &rsaKeyPair,
		host:       host,
		timeout:    0,
	}
}

type Client struct {
	username   string
	password   string
	rsaKeyPair *RsaKeyPair
	host       string
	timeout    time.Duration
}

func (p *Client) WithTimeout(timeout time.Duration) *Client {
	p.timeout = timeout
	return p
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

func (p *Client) IsRootUser() (bool, error) {
	executionResult, err := p.Execute("whoami")
	if err != nil {
		return false, err
	}
	if executionResult.IsError() {
		return false, executionResult.Error()
	}
	return executionResult.Output == "root", nil
}

func (p *Client) Executef(command string, a ...any) (ExecutionResult, error) {
	return p.Execute(fmt.Sprintf(command, a...))
}

func (p *Client) Execute(command string) (ExecutionResult, error) {
	return p.ExecuteWithOptions(ExecuteOptions{
		Command: command,
		Stdin:   nil,
		Retries: 1,
	})
}
func (p *Client) ExecuteWithOptions(options ExecuteOptions) (ExecutionResult, error) {
	var result ExecutionResult
	var err error
	var retries = uint(1)
	if options.Retries > 0 {
		retries = options.Retries
	}
	_ = utils.Retry(retries, options.TimeBetweenRetries, func(attempt uint) error {
		executionResult, rerr := p.executeWithStdin(options.Command, options.Stdin)
		result = executionResult
		if rerr != nil {
			log.WithError(rerr).Error("Execute command finished with error")
			err = rerr
			return rerr
		}
		if executionResult.IsError() {
			log.WithError(executionResult.Error()).Error("Execute command finished with error")
			return executionResult.Error()
		}
		err = nil // Reset main error, command executed correctly after some retires
		return nil
	})
	return result, err
}

func (p *Client) executeWithStdin(command string, stdin io.Reader) (ExecutionResult, error) {
	var config *ssh.ClientConfig
	if p.rsaKeyPair == nil {
		config = &ssh.ClientConfig{
			User: p.username,
			Auth: []ssh.AuthMethod{
				ssh.Password(p.password),
			},
			HostKeyCallback: ssh.InsecureIgnoreHostKey(),
			Timeout:         p.timeout,
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
			Timeout:         p.timeout,
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
		_ = session.Close()
		_ = conn.Close()
	}()

	//Run command
	var buffOut bytes.Buffer
	var buffErr bytes.Buffer
	session.Stdout = &buffOut
	session.Stderr = &buffErr
	session.Stdin = stdin
	err = session.Run(command)
	if err != nil {
		errOut := buffErr.String()
		if len(errOut) == 0 {
			errOut = buffOut.String()
		}
		code := -1
		switch err.(type) {
		case *ssh.ExitError:
			code = err.(*ssh.ExitError).ExitStatus()
		default:
			log.Errorf("ssh client returned string error instead ExitError [%s]", err)
		}
		return ExecutionResult{
			Output: buffOut.String(),
			error: &ExecutionError{
				Output: errOut,
				Code:   code,
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
	o := e.Output
	if len(o) == 0 {
		o = "[NO OUTPUT]"
	}
	return errors.New(fmt.Sprintf("[%d] - %s", e.Code, o))
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
