package app

import (
	"context"
	"github.com/dsieradzki/k4prox/pkg/logfile"
	"github.com/dsieradzki/k4prox/pkg/wails"
)

// App struct
type App struct {
	ctx              context.Context
	contextConsumers []wails.ContextSetter
}

func NewApp(contextConsumers []wails.ContextSetter) *App {
	return &App{
		contextConsumers: contextConsumers,
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	for _, v := range a.contextConsumers {
		v.SetContext(ctx)
	}
}
func (a *App) Shutdown(ctx context.Context) {

}

func (a *App) LogFileLocation() string {
	return logfile.PrepareLogFile()
}

func (a *App) GetContext() context.Context {
	return a.ctx
}
