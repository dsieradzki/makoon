package task

import (
	"context"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"testing"
	"time"
)

func TestTaskExecutor(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Task Executor")
}

var _ = Describe("Task Executor", func() {
	Context("Run 4 tasks", func() {
		When("all tasks ends", func() {
			executor := NewTaskExecutor[bool]()
			alwaysTrueTask := func(ctx context.Context) (bool, error) {
				time.Sleep(100 * time.Millisecond)
				return true, nil
			}

			executor.AddTask(context.Background(), alwaysTrueTask)
			executor.AddTask(context.Background(), alwaysTrueTask)
			executor.AddTask(context.Background(), alwaysTrueTask)
			executor.AddTask(context.Background(), alwaysTrueTask)
			executor.Wait()
			It("returns value", func() {
				Expect(executor.Results()).Should(HaveLen(4))
			})
		})
	})
})
