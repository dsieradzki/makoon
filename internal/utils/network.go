package utils

import (
	"errors"
	"os/exec"
)

const timeout = "1"
const probes = "1"
const ping = "ping"

func PingHost(ip string) (bool, error) {
	if !IsCheckIPToolAvailable() {
		return false, errors.New("no ping program in path")
	}

	cmd := exec.Command("ping", ProbesParamName(), probes, TimeoutParamName(), timeout, ip)
	cmd.SysProcAttr = GetSysProcAttr()
	if err := cmd.Run(); err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			return exitError.ExitCode() == 0, nil
		} else {
			return false, exitError
		}
	} else {
		return true, err
	}
}

func IsCheckIPToolAvailable() bool {
	_, err := exec.LookPath(ping)
	return err == nil
}
