//go:build windows

package utils

import "syscall"

func GetSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{HideWindow: true}
}

func TimeoutParamName() string {
	return "-w"
}

func ProbesParamName() string {
	return "-n"
}
