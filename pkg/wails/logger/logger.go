package logger

import (
	log "github.com/sirupsen/logrus"
	"github.com/wailsapp/wails/v2/pkg/logger"
)

var wailsToLogrusLoggerAdapter = wailsLogger{}

func Default() logger.Logger {
	return wailsToLogrusLoggerAdapter
}

type wailsLogger struct {
}

func (w wailsLogger) Print(message string) {
	log.Print(message)
}

func (w wailsLogger) Trace(message string) {
	log.Trace(message)
}

func (w wailsLogger) Debug(message string) {
	log.Debug(message)
}

func (w wailsLogger) Info(message string) {
	log.Info(message)
}

func (w wailsLogger) Warning(message string) {
	log.Warn(message)
}

func (w wailsLogger) Error(message string) {
	log.Error(message)
}

func (w wailsLogger) Fatal(message string) {
	log.Fatal(message)
}
