package wails

import "context"

type ContextSetter interface {
	SetContext(ctx context.Context)
}
