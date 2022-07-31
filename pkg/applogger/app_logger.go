package applogger

import log "github.com/sirupsen/logrus"

type WailsToLogger struct {
}

func (w WailsToLogger) Print(message string) {
	log.Print(message)
}

func (w WailsToLogger) Trace(message string) {
	log.Trace(message)
}

func (w WailsToLogger) Debug(message string) {
	log.Debug(message)
}

func (w WailsToLogger) Info(message string) {
	log.Info(message)
}

func (w WailsToLogger) Warning(message string) {
	log.Warn(message)
}

func (w WailsToLogger) Error(message string) {
	log.Error(message)
}

func (w WailsToLogger) Fatal(message string) {
	log.Fatal(message)
}
