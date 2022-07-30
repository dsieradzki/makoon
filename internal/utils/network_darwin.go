//go:build darwin

package utils

import "syscall"

func GetSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{}
}

func TimeoutParamName() string {
	return "-W"
}

func ProbesParamName() string {
	return "-c"
}
