package task

import (
	"context"
	"sync"
)

func NewTaskExecutor[T any]() *Executor[T] {
	return NewTaskExecutorWithBuffer[T](1)
}

func NewTaskExecutorWithBuffer[T any](bufferSize int) *Executor[T] {
	executor := &Executor[T]{
		resultsC: make(chan Result[T], bufferSize),
		results: Results[T]{
			Values: make([]Result[T], 0),
		},
	}
	executor.handleResultChannel()
	return executor
}

type Results[T any] struct {
	Values []Result[T]
}

func (r Results[T]) AnyError() error {
	for _, v := range r.Values {
		if v.Error != nil {
			return v.Error
		}
	}
	return nil
}

type Result[T any] struct {
	Value T
	Error error
}
type Executor[T any] struct {
	wg              sync.WaitGroup
	handleResultsWg sync.WaitGroup
	resultsC        chan Result[T]
	results         Results[T]
}

func (t *Executor[T]) handleResultChannel() {
	t.handleResultsWg.Add(1)
	go func() {
		for v := range t.resultsC {
			t.results.Values = append(t.results.Values, v)
		}
		t.handleResultsWg.Done()
	}()

}

func (t *Executor[T]) AddTask(c context.Context, task func(context.Context) (T, error)) {
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

func (t *Executor[T]) Wait() {
	t.wg.Wait()
	close(t.resultsC)
	t.handleResultsWg.Wait()
}

func (t *Executor[T]) Results() Results[T] {
	return t.results
}
