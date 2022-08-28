package main

import (
	"embed"
	"fmt"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/event"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/tasklog"
	"github.com/dsieradzki/k4prox/pkg/app"
	"github.com/dsieradzki/k4prox/pkg/logfile"
	"github.com/dsieradzki/k4prox/pkg/service/auth"
	"github.com/dsieradzki/k4prox/pkg/service/project"
	"github.com/dsieradzki/k4prox/pkg/service/provisioner"
	tasklogService "github.com/dsieradzki/k4prox/pkg/service/tasklog"
	custWails "github.com/dsieradzki/k4prox/pkg/wails"
	appLogger "github.com/dsieradzki/k4prox/pkg/wails/logger"
	log "github.com/sirupsen/logrus"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"os"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	log.SetLevel(log.TraceLevel)
	file, err := os.OpenFile(logfile.PrepareLogFile(), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err == nil {
		log.SetOutput(file)
	} else {
		log.Info("Failed to log to file, using default")
	}
	proxmoxClient := proxmox.NewClient()
	proxmoxSsh := ssh.NewClient()
	eventCollector := event.NewCollector()

	eventSourceForTaskLog := func() []tasklog.Event {
		return collect.Map(eventCollector.Get(), func(e event.Event) tasklog.Event {
			return tasklog.Event{
				CorrelationId: e.CorrelationId,
				CreateTime:    e.CreateTime,
				Name:          e.Name,
				Details:       e.Details,
				State:         tasklog.EventState(e.State),
			}
		})
	}
	taskLogReader := tasklog.NewReader(eventSourceForTaskLog)

	// SERVICES
	authService := auth.NewService(proxmoxClient, proxmoxSsh)
	projectService := project.NewService(proxmoxClient)
	provisionerService := provisioner.NewService(projectService, proxmoxClient, proxmoxSsh, eventCollector)
	taskLogService := tasklogService.NewService(eventCollector, taskLogReader)

	application := app.NewApp([]custWails.ContextSetter{
		projectService,
	})

	err = wails.Run(&options.App{

		Title:              "K4Prox",
		Width:              1370,
		Height:             850,
		Assets:             assets,
		OnStartup:          application.Startup,
		OnShutdown:         application.Shutdown,
		LogLevel:           logger.DEBUG,
		LogLevelProduction: logger.DEBUG,
		Logger:             appLogger.Default(),
		Bind: []any{
			application,
			projectService,
			authService,
			provisionerService,
			taskLogService,
		},
	})

	if err != nil {
		fmt.Println("Error: ", err.Error())
	}
}
