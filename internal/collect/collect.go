package collect

import "sort"

func Filter[T any](c []T, ff func(T) bool) []T {
	var result []T
	for _, v := range c {
		if ff(v) {
			result = append(result, v)
		}
	}
	return result
}

func Not[T comparable](v T) func(T) bool {
	return func(t T) bool {
		return v != t
	}
}

/*
	Sorting without side effect and using generic types
	Consume more memory in comparison to standard sorting
	due to working on copy of data set
*/
func Sort[T any](c []T, sf func(a T, b T) bool) []T {
	result := make([]T, len(c))
	copy(result, c)
	sort.Slice(result, func(i, j int) bool {
		return sf(result[i], result[j])
	})
	return result
}

func Map[TI any, TO any](c []TI, mf func(TI) TO) []TO {
	var result []TO
	for _, v := range c {
		result = append(result, mf(v))
	}
	return result
}

func MapMap[KTI comparable, VTI any, TO any](c map[KTI]VTI, mf func(KTI, VTI) TO) []TO {
	var result []TO
	for k, v := range c {
		result = append(result, mf(k, v))
	}
	return result
}

func Reduce[TI any, TO any](c []TI, init TO, rf func(acc TO, next TI) TO) TO {
	var acc = init

	for _, v := range c {
		acc = rf(acc, v)
	}

	return acc
}

func Group[KT comparable, T any](c []T, groupFunc func(T) KT) [][]T {
	mapOfGroups := make(map[KT][]T, 0)
	for _, v := range c {
		key := groupFunc(v)
		mapOfGroups[key] = append(mapOfGroups[key], v)
	}

	var result [][]T
	for _, v := range mapOfGroups {
		result = append(result, v)
	}
	return result
}
