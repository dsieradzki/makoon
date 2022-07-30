package applogger

import (
	"os"
	"path"
)

const LogFileName = "k4prox.log"
const AppDirNameInHomeDir = "k4prox"

func logFileInTempLocation() string {
	return path.Join(os.TempDir(), LogFileName)
}

type LogFile struct {
}
