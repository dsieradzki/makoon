package utils

import (
	"context"
	"fmt"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	log "github.com/sirupsen/logrus"
	"k4prox/internal/collect"
	"testing"
)

func TestTaskExecutor(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Task Executor")
}

var _ = Describe("Task Executor", func() {
	//Context("Run 4 tasks", func() {
	//	When("all tasks ends", func() {
	//		executor := NewTaskExecutor[bool]()
	//		alwaysTrueTask := func(ctx context.Context) (bool, error) {
	//			time.Sleep(100 * time.Millisecond)
	//			return true, nil
	//		}
	//
	//		executor.AddTask(context.Background(), alwaysTrueTask)
	//		executor.AddTask(context.Background(), alwaysTrueTask)
	//		executor.AddTask(context.Background(), alwaysTrueTask)
	//		executor.AddTask(context.Background(), alwaysTrueTask)
	//		executor.Wait()
	//		It("returns value", func() {
	//			Expect(executor.Results()).Should(HaveLen(4))
	//		})
	//	})
	//})
	Context("xx", func() {
		When("xx", func() {

			pingTask := func(ctx context.Context) (bool, error) {
				ipToCheck := fmt.Sprintf("%s.%d", "192.168.1", ctx.Value("ip"))
				available, err := PingHost(ipToCheck)
				log.Infof("Ping [%s] host to check IP reservation. Host available: [%t]", ipToCheck, available)
				return available, err
			}

			for i := 10; i <= 240; i = i + 20 {
				executor := NewTaskExecutor[bool]()
				log.Infof("Check ip from 192.168.1.%d to 192.168.1.%d", i, i+20)
				for j := i; j < i+20; j++ {
					executor.AddTask(context.WithValue(context.Background(), "ip", j), pingTask)
				}
				executor.Wait()

				reduce := collect.Reduce(
					executor.Results(),
					Result[bool]{Value: false, Error: nil},
					func(acc Result[bool], next Result[bool]) Result[bool] {
						err := acc.Error
						if next.Error != nil {
							err = next.Error
						}
						return Result[bool]{
							Value: acc.Value || next.Value,
							Error: err,
						}
					})
				fmt.Println(reduce)
			}

			It("returns value", func() {

			})
		})
	})

})
