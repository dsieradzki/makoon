//go:build production && windows

package applogger

import (
	"os"
	"path"
)

const WindowsAppDirNameInHomeDir = "." + AppDirNameInHomeDir

func PrepareLogFile() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return logFileInTempLocation()
	}
	logDirectory := path.Join(home, WindowsAppDirNameInHomeDir)

	err = os.MkdirAll(logDirectory, 0750)
	if err != nil {
		return logFileInTempLocation()
	}
	return path.Join(logDirectory, LogFileName)
}
