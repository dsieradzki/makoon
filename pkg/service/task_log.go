package service

import (
	"github.com/dsieradzki/k4prox/internal/event"
	"github.com/dsieradzki/k4prox/internal/tasklog"
)

func NewTaskLogService(eventCollector *event.Collector, taskLogReader *tasklog.Reader) *TaskLogService {
	return &TaskLogService{
		eventCollector: eventCollector,
		taskLogReader:  taskLogReader,
	}
}

type TaskLogService struct {
	eventCollector *event.Collector
	taskLogReader  *tasklog.Reader
}

func (t *TaskLogService) GetTaskLog() []tasklog.Task {
	return t.taskLogReader.Logs()
}

func (t *TaskLogService) ClearTaskLog() int {
	return t.eventCollector.Clear()
}
