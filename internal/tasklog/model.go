package tasklog

import (
	"encoding/json"
	"errors"
	"fmt"
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
	CorrelationId uuid.UUID
	CreateTime    time.Time
	Name          string
	Details       string
	State         EventState
}

type EventSource func() []Event

type Duration time.Duration

func (d Duration) MarshalJSON() ([]byte, error) {
	seconds := time.Duration(d).Seconds()
	return json.Marshal(fmt.Sprintf("%.2f", seconds))
}

func (d *Duration) UnmarshalJSON(b []byte) error {
	var v interface{}
	if err := json.Unmarshal(b, &v); err != nil {
		return err
	}
	switch value := v.(type) {
	case float64:
		*d = Duration(time.Duration(value))
		return nil
	case string:
		tmp, err := time.ParseDuration(value)
		if err != nil {
			return err
		}
		*d = Duration(tmp)
		return nil
	default:
		return errors.New("invalid duration")
	}
}

type TaskState EventState

type Task struct {
	CorrelationId uuid.UUID `json:"correlationId"`
	CreateTime    time.Time `json:"createTime"`
	Duration      Duration  `json:"duration"`
	Name          string    `json:"name"`
	Details       []string  `json:"details"`
	State         TaskState `json:"state"`
}
