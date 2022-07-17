package tasklog

import (
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/google/uuid"
	"time"
)

var (
	noTime = time.Unix(0, 0)
	noUUID = uuid.UUID{}
)

func NewTaskLogReader(eventSource EventSource) *Reader {
	return &Reader{
		eventSource: eventSource,
	}
}

type Reader struct {
	eventSource EventSource
}

func (r *Reader) Logs() []Task {
	eventGroups := collect.Group(r.eventSource(), byCorrelationId)
	taskLog := collect.Map(eventGroups, fromEventsToTask)
	return collect.Sort(taskLog, func(a Task, b Task) bool {
		return a.CreateTime.After(b.CreateTime)
	})
}

func fromEventsToTask(events []Event) Task {
	sortedEvents := collect.Sort(events, byCreationTime())
	return collect.Reduce(sortedEvents, withInitialTask(), mergeEventWithTask)
}

func byCorrelationId(i Event) uuid.UUID {
	return i.CorrelationId
}

func byCreationTime() func(a Event, b Event) bool {
	return func(a Event, b Event) bool {
		return a.CreateTime.Before(b.CreateTime)
	}
}

func mergeEventWithTask(task Task, event Event) Task {
	var createTime time.Time
	var duration time.Duration
	var state TaskState
	var details = task.Details

	if task.CreateTime == noTime {
		createTime = event.CreateTime
		state = TaskState(event.State)
		duration = time.Now().Sub(event.CreateTime)
	} else {
		createTime = task.CreateTime
		state = TaskState(event.State)
		duration = event.CreateTime.Sub(task.CreateTime)
	}

	if len(event.Details) > 0 {
		details = append(details, event.Details)
	}

	return Task{
		CorrelationId: event.CorrelationId,
		CreateTime:    createTime,
		Duration:      Duration(duration),
		Name:          event.Name,
		Details:       details,
		State:         state,
	}
}

func withInitialTask() Task {
	return Task{
		CorrelationId: noUUID,
		CreateTime:    noTime,
		Duration:      0,
		Name:          "",
		Details:       []string{},
		State:         "",
	}
}
