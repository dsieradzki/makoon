package service

import "context"

type WailsContext interface {
	SetContext(ctx context.Context)
}
