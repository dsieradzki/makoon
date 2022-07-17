package collect

import (
	"github.com/onsi/gomega"
	"strings"
	"testing"
)

type Arch string

const (
	X86 Arch = "x86"
	Arm Arch = "arm"
)

type Cpu struct {
	Name  string
	Arch  Arch
	Cores int
}

func TestFilter(t *testing.T) {
	g := gomega.NewWithT(t)
	dataset := createDataSet()

	result := Filter(dataset, func(i Cpu) bool {
		return len(i.Name) > 0
	})

	g.Expect(result).Should(gomega.HaveLen(3))
}

func TestMap(t *testing.T) {
	g := gomega.NewWithT(t)
	dataset := createDataSet()

	result := Map(dataset, func(i Cpu) string {
		return strings.ToUpper(i.Name)
	})

	g.Expect(result).Should(gomega.ConsistOf("SNAPDRAGON", "I5", "I7", ""))
}

func TestSort(t *testing.T) {
	g := gomega.NewWithT(t)
	dataset := createDataSet()

	result := Sort(dataset, func(a Cpu, b Cpu) bool {
		return a.Cores < b.Cores
	})

	g.Expect(result[0]).To(gomega.HaveField("Cores", 0))
	g.Expect(result[1]).To(gomega.HaveField("Cores", 3))
	g.Expect(result[2]).To(gomega.HaveField("Cores", 4))
	g.Expect(result[3]).To(gomega.HaveField("Cores", 8))
}

func TestReduce(t *testing.T) {
	g := gomega.NewWithT(t)
	dataset := []int{0, 8, 4, 3}

	result := Reduce(dataset, 0, func(acc int, next int) int {
		return acc + next
	})

	g.Expect(result).To(gomega.Equal(15))
}

func createDataSet() []Cpu {
	return []Cpu{
		{
			Name:  "Snapdragon",
			Arch:  Arm,
			Cores: 8,
		},
		{
			Name:  "i5",
			Arch:  X86,
			Cores: 3,
		},
		{
			Name:  "i7",
			Arch:  X86,
			Cores: 4,
		},
		{
			Name:  "",
			Arch:  Arm,
			Cores: 0,
		},
	}

}
