package main

import (
	"embed"
	"github.com/dsieradzki/k4prox/internal/app"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/event"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/tasklog"
	"github.com/dsieradzki/k4prox/pkg/service"
	"github.com/dsieradzki/k4prox/pkg/service/project"
	log "github.com/sirupsen/logrus"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	log.SetLevel(log.TraceLevel)
	proxmoxClient := proxmox.NewProxmoxClient()
	proxmoxSsh := ssh.NewSshClient()
	eventCollector := event.NewEventCollector()

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
	taskLogReader := tasklog.NewTaskLogReader(eventSourceForTaskLog)

	// SERVICES
	loginService := service.NewLoginService(proxmoxClient, proxmoxSsh)
	projectService := project.NewProjectService(proxmoxClient)
	provisionerService := service.NewProvisionerService(projectService, proxmoxClient, proxmoxSsh, eventCollector)
	taskLogService := service.NewTaskLogService(eventCollector, taskLogReader)

	application := app.NewApp([]service.WailsContext{
		projectService,
	})
	// Create application with options
	err := wails.Run(&options.App{

		Title:      "K4Prox",
		Width:      1370,
		Height:     850,
		Assets:     assets,
		OnStartup:  application.Startup,
		OnShutdown: application.Shutdown,
		Bind: []interface{}{
			projectService,
			loginService,
			provisionerService,
			taskLogService,
		},
	})

	if err != nil {
		println("Error:", err)
	}
}
