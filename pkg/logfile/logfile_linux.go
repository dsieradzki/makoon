//go:build production && linux

package logfile

import (
	"os"
	"path"
)

const LinuxAppDirNameInHomeDir = "." + AppDirNameInHomeDir

func PrepareLogFile() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return logFileInTempLocation()
	}
	logDirectory := path.Join(home, LinuxAppDirNameInHomeDir)

	err = os.MkdirAll(logDirectory, 0750)
	if err != nil {
		return logFileInTempLocation()
	}
	return path.Join(logDirectory, LogFileName)
}
