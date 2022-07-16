package event

import (
	"github.com/google/uuid"
	"time"
)

type EventState string

const (
	StartingEvent EventState = "started"
	FinishedEvent EventState = "finished"
	ErrorEvent    EventState = "error"
)

type Event struct {
	CorrelationId uuid.UUID  `json:"correlationId"`
	Source        string     `json:"source"`
	CreateTime    time.Time  `json:"createTime"`
	Name          string     `json:"name"`
	Details       string     `json:"details"`
	State         EventState `json:"state"`
}
