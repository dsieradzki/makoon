package event

import (
	"github.com/google/uuid"
	"time"
)

type Session struct {
	correlationId uuid.UUID
	name          string
	collector     *Collector
}

func (s *Session) start(details string) {
	s.collector.Add(Event{
		CorrelationId: s.correlationId,
		CreateTime:    time.Now(),
		Name:          s.name,
		Details:       details,
		State:         StartingEvent,
	})
}

func (s *Session) ReportError(e error) {
	s.collector.Add(Event{
		CorrelationId: s.correlationId,
		CreateTime:    time.Now(),
		Name:          s.name,
		Details:       e.Error(),
		State:         ErrorEvent,
	})
}

func (s *Session) Done() {
	s.DoneWithDetails("")
}

func (s *Session) DoneWithDetails(details string) {
	s.collector.Add(Event{
		CorrelationId: s.correlationId,
		CreateTime:    time.Now(),
		Name:          s.name,
		Details:       details,
		State:         FinishedEvent,
	})
}
