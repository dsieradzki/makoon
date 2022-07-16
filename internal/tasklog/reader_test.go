package tasklog

import (
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"testing"
	"time"
)

func TestTaskLog(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Task log")
}

var _ = Describe("Task log", func() {
	Context("User reads task log", func() {
		When("is no events", func() {
			reader := readerWithNoEvents()
			It("there are no tasks", func() {
				Expect(reader.Logs()).
					Should(HaveLen(0))
			})
		})
		When("is only start event", func() {
			reader := readerWithOneEvent()
			It("task is in progress state", func() {

				Expect(reader.Logs()).
					Should(HaveLen(1))

				Expect(reader.Logs()[0]).
					To(HaveField("State", TaskState(StartingEvent)))
			})
		})
		When("are two events with same id and second has finish status", func() {
			reader := readerWithTwoEventsWithTheSameIdAndSecondWithFinishState()
			It("there is one task with finish status", func() {

				Expect(reader.Logs()).
					Should(HaveLen(1))

				Expect(reader.Logs()).
					Should(
						ContainElement(NewTaskBuilder().
							WithCreateTime(time.Unix(100, 0)).
							WithDuration(100 * time.Second).
							WithState(TaskState(FinishedEvent)).
							Build(),
						))
			})
		})
	})

})

func readerWithOneEvent() *Reader {
	return NewTaskLogReader(func() []Event {
		return []Event{
			NewEventBuilder().
				WithState(StartingEvent).
				Build(),
		}
	})
}
func readerWithTwoEventsWithTheSameIdAndSecondWithFinishState() *Reader {
	return NewTaskLogReader(func() []Event {
		return []Event{
			NewEventBuilder().
				WithCreateTime(time.Unix(100, 0)).
				WithState(StartingEvent).
				Build(),
			NewEventBuilder().
				WithCreateTime(time.Unix(200, 0)).
				WithState(FinishedEvent).
				Build(),
		}
	})
}

func readerWithNoEvents() *Reader {
	return NewTaskLogReader(func() []Event { return []Event{} })
}

type EventBuilder struct {
	event Event
}

func (b *EventBuilder) WithCorrelationId(correlationId uuid.UUID) *EventBuilder {
	b.event.CorrelationId = correlationId
	return b
}
func (b *EventBuilder) WithCreateTime(createTime time.Time) *EventBuilder {
	b.event.CreateTime = createTime
	return b
}
func (b *EventBuilder) WithName(name string) *EventBuilder {
	b.event.Name = name
	return b
}
func (b *EventBuilder) WithDetails(details string) *EventBuilder {
	b.event.Details = details
	return b
}
func (b *EventBuilder) WithState(state EventState) *EventBuilder {
	b.event.State = state
	return b
}
func (b *EventBuilder) Build() Event {
	return b.event
}

func NewEventBuilder() *EventBuilder {
	return &EventBuilder{}
}

type TaskBuilder struct {
	task Task
}

func NewTaskBuilder() *TaskBuilder {
	return &TaskBuilder{
		task: Task{Details: []string{}},
	}
}

func (b *TaskBuilder) WithCorrelationId(correlationId uuid.UUID) *TaskBuilder {
	b.task.CorrelationId = correlationId
	return b
}

func (b *TaskBuilder) WithCreateTime(createTime time.Time) *TaskBuilder {
	b.task.CreateTime = createTime
	return b
}

func (b *TaskBuilder) WithDuration(duration time.Duration) *TaskBuilder {
	b.task.Duration = Duration(duration)
	return b
}

func (b *TaskBuilder) WithName(name string) *TaskBuilder {
	b.task.Name = name
	return b
}

func (b *TaskBuilder) WithDetails(details string) *TaskBuilder {
	b.task.Details = append(b.task.Details, details)
	return b
}

func (b *TaskBuilder) WithState(state TaskState) *TaskBuilder {
	b.task.State = state
	return b
}

func (b *TaskBuilder) Build() Task {
	return b.task
}
