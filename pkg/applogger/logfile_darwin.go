//go:build production && darwin

package applogger

import (
	"os"
	"path"
)

func PrepareLogFile() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return logFileInTempLocation()
	}
	logDirectory := path.Join(home, "Library", "Logs", AppDirNameInHomeDir)
	err = os.MkdirAll(logDirectory, 0750)
	if err != nil {
		return logFileInTempLocation()
	}
	return path.Join(logDirectory, LogFileName)
}
