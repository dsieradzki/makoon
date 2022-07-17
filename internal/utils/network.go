package utils

import (
	"os/exec"
	"runtime"
)

const timeout = "1"
const probes = "1"

func PingHost(ip string) (bool, error) {
	probesParamName := ""
	timeoutParamName := ""
	//noinspection ALL
	if runtime.GOOS == "windows" {
		probesParamName = "-n"
	} else {
		probesParamName = "-c"
	}
	//noinspection ALL
	if runtime.GOOS == "darwin" {
		timeoutParamName = "-W"
	} else {
		timeoutParamName = "-w"
	}
	cmd := exec.Command("ping", probesParamName, probes, timeoutParamName, timeout, ip)
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
