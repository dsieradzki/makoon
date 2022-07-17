package utils

import (
	"context"
	"sync"
)

func NewTaskExecutor[T any]() *TaskExecutor[T] {
	return NewTaskExecutorWithBuffer[T](1)
}

func NewTaskExecutorWithBuffer[T any](bufferSize int) *TaskExecutor[T] {
	executor := &TaskExecutor[T]{
		resultsC: make(chan Result[T], bufferSize),
		results:  make([]Result[T], 0),
	}
	executor.handleResultChannel()
	return executor
}

type Result[T any] struct {
	Value T
	Error error
}
type TaskExecutor[T any] struct {
	wg              sync.WaitGroup
	handleResultsWg sync.WaitGroup
	resultsC        chan Result[T]
	results         []Result[T]
}

func (t *TaskExecutor[T]) handleResultChannel() {
	t.handleResultsWg.Add(1)
	go func() {
		for v := range t.resultsC {
			t.results = append(t.results, v)
		}
		t.handleResultsWg.Done()
	}()

}

func (t *TaskExecutor[T]) AddTask(c context.Context, task func(context.Context) (T, error)) {
	t.wg.Add(1)
	go func(ctx context.Context) {
		val, err := task(ctx)
		t.resultsC <- Result[T]{
			Value: val,
			Error: err,
		}
		t.wg.Done()
	}(c)
}

func (t *TaskExecutor[T]) Wait() {
	t.wg.Wait()
	close(t.resultsC)
	t.handleResultsWg.Wait()
}

func (t *TaskExecutor[T]) Results() []Result[T] {
	return t.results
}
