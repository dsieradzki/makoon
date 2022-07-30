package app

import (
	"context"
	"github.com/dsieradzki/k4prox/pkg/applogger"
	"github.com/dsieradzki/k4prox/pkg/service"
)

// App struct
type App struct {
	ctx              context.Context
	contextConsumers []service.WailsContext
}

// NewApp creates a new App application struct
func NewApp(contextConsumers []service.WailsContext) *App {
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
	return applogger.PrepareLogFile()
}

func (a *App) GetContext() context.Context {
	return a.ctx
}
