//go:build linux

package utils

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
