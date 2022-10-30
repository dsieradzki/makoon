package provisioner

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"testing"
)

func TestFindFreeIdRangeForVM(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Find Free Id Range For VM")
}

var _ = DescribeTable("Find Free Id Range For VM",
	func(usedIds []uint32, expected uint32) {
		firstFreeIdFromRange := findStartIdForFreeIdWindow(usedIds, 20)
		Expect(firstFreeIdFromRange).Should(Equal(expected))
	},
	Entry("When is not used ids", []uint32{}, uint32(100)),
	Entry("When some ids are used #1", []uint32{100, 105}, uint32(110)),
	Entry("When some ids are used #2", []uint32{100, 105, 130}, uint32(140)),
	Entry("When some ids are used #3", []uint32{100, 105, 130, 140, 170}, uint32(180)),
)
