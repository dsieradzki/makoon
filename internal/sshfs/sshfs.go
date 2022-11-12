package sshfs

import (
	"bytes"
	"fmt"
	"github.com/dsieradzki/k4prox/internal/ssh"
)

func Create(remoteHost *ssh.Client) *RemoteFs {
	return &RemoteFs{
		remoteHost: remoteHost,
	}
}

type RemoteFs struct {
	remoteHost *ssh.Client
}

func (r *RemoteFs) ReadFile(fileName string) ([]byte, error) {
	executionResult, err := r.remoteHost.Executef("cat %s", fileName)
	if err != nil {
		return nil, err
	}
	if executionResult.IsError() {
		return nil, executionResult.Error()
	}
	return []byte(executionResult.Output), nil
}

func (r *RemoteFs) Write(fileName string, p []byte) error {
	executionResult, err := r.remoteHost.ExecuteWithOptions(ssh.ExecuteOptions{
		Command: fmt.Sprintf("cat > %s", fileName),
		Stdin:   bytes.NewReader(p),
	})
	if err != nil {
		return err
	}
	if executionResult.IsError() {
		return executionResult.Error()
	}
	return nil
}

func (r *RemoteFs) IsExists(fileName string) (bool, error) {
	result, err := r.remoteHost.Executef("test -e %s", fileName)
	if err != nil {
		return false, err
	}

	switch result.Code() {
	case 0:
		return true, nil
	case 1:
		return false, nil
	default:
		return false, result.Error()
	}
}

func (r *RemoteFs) CreateDirectory(filePath string) error {
	result, err := r.remoteHost.Executef("mkdir -p %s", filePath)
	if err != nil {
		return err
	}
	return result.Error()
}
