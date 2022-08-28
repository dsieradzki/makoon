package tasklog

import (
	"github.com/dsieradzki/k4prox/internal/event"
	"github.com/dsieradzki/k4prox/internal/tasklog"
)

func NewService(eventCollector *event.Collector, taskLogReader *tasklog.Reader) *Service {
	return &Service{
		eventCollector: eventCollector,
		taskLogReader:  taskLogReader,
	}
}

type Service struct {
	eventCollector *event.Collector
	taskLogReader  *tasklog.Reader
}

func (t *Service) GetTaskLog() []tasklog.Task {
	return t.taskLogReader.Logs()
}

func (t *Service) ClearTaskLog() int {
	return t.eventCollector.Clear()
}
