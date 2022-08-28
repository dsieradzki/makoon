//go:build linux

package network

import "syscall"

func GetSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{}
}

func TimeoutParamName() string {
	return "-w"
}

func ProbesParamName() string {
	return "-c"
}
