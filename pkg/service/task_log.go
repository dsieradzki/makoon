package service

import (
	"github.com/dsieradzki/K4Prox/internal/event"
	"github.com/dsieradzki/K4Prox/internal/tasklog"
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
