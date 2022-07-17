package event

import (
	"fmt"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

func NewEventCollector() *Collector {
	log.Info("Create event collector")
	collector := Collector{
		events:       make([]Event, 0),
		eventChannel: make(chan Event),
	}
	go collector.handleEvents()
	return &collector
}

type Collector struct {
	events       []Event
	eventChannel chan Event
}

func (ec *Collector) handleEvents() {
	log.Info("Start event receiver")
	for {
		e := <-ec.eventChannel
		log.
			WithTime(e.CreateTime).
			WithFields(log.Fields{
				"CorrelationId": e.CorrelationId,
				"Name":          e.Name,
				"State":         e.State,
				"Details":       e.Details,
			}).
			Info("Received event")
		ec.events = append(ec.events, e)
	}
}

func (ec *Collector) Startf(name string, a ...any) *Session {
	return ec.Start(fmt.Sprintf(name, a...))
}

func (ec *Collector) Start(name string) *Session {
	return ec.StartWithDetails(name, "")
}

func (ec *Collector) StartWithDetails(name string, details string) *Session {
	session := Session{
		correlationId: uuid.New(),
		name:          name,
		collector:     ec,
	}
	session.start(details)
	return &session
}

func (ec *Collector) Add(event Event) {
	ec.eventChannel <- event
}

func (ec *Collector) Get() []Event {
	return ec.events
}

func (ec *Collector) Clear() int {
	l := len(ec.events)
	ec.events = make([]Event, 0)
	return l
}
