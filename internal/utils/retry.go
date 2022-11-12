package utils

import "time"

func Retry(attempts uint, waitTime time.Duration, task func(attempt uint) error) error {
	var lastError error = nil
	for i := uint(1); i <= attempts+1; i++ {
		if i == attempts+1 {
			return lastError
		}
		lastError = task(i)
		if lastError == nil {
			return nil
		} else {
			time.Sleep(waitTime)
		}
	}

	return lastError
}
