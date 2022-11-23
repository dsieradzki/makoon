package main

import (
	"embed"
	"fmt"
	"github.com/dsieradzki/k4prox/internal/collect"
	"github.com/dsieradzki/k4prox/internal/event"
	"github.com/dsieradzki/k4prox/internal/k4p"
	"github.com/dsieradzki/k4prox/internal/proxmox"
	"github.com/dsieradzki/k4prox/internal/ssh"
	"github.com/dsieradzki/k4prox/internal/tasklog"
	"github.com/dsieradzki/k4prox/pkg/app"
	"github.com/dsieradzki/k4prox/pkg/logfile"
	"github.com/dsieradzki/k4prox/pkg/service/auth"
	"github.com/dsieradzki/k4prox/pkg/service/database"
	"github.com/dsieradzki/k4prox/pkg/service/management"
	"github.com/dsieradzki/k4prox/pkg/service/provisioner"
	tasklogService "github.com/dsieradzki/k4prox/pkg/service/tasklog"
	custWails "github.com/dsieradzki/k4prox/pkg/wails"
	appLogger "github.com/dsieradzki/k4prox/pkg/wails/logger"
	log "github.com/sirupsen/logrus"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"os"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	switch os.Getenv("K4PROX_LOGLEVEL") {
	case "TRACE":
		log.SetLevel(log.TraceLevel)
	case "DEBUG":
		log.SetLevel(log.DebugLevel)
	case "INFO":
		log.SetLevel(log.InfoLevel)
	case "WARNING":
		log.SetLevel(log.WarnLevel)
	case "ERROR":
		log.SetLevel(log.ErrorLevel)
	case "FATAL":
		log.SetLevel(log.FatalLevel)
	case "PANIC":
		log.SetLevel(log.PanicLevel)
	default:
		log.SetLevel(log.DebugLevel)
	}

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
	databaseService := database.NewService(proxmoxClient, proxmoxSsh)
	k4pService := k4p.NewK4PService(proxmoxClient, proxmoxSsh, eventCollector)
	provisionerService := provisioner.NewService(databaseService, proxmoxClient, eventCollector, k4pService)
	taskLogService := tasklogService.NewService(eventCollector, taskLogReader)
	managementService := management.NewService(databaseService, proxmoxClient, k4pService)
	clusterGenerator := provisioner.NewGenerator(proxmoxClient)

	application := app.NewApp([]custWails.ContextSetter{
		databaseService,
	})

	err = wails.Run(&options.App{

		Title:  "K4Prox",
		Width:  1370,
		Height: 870,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:          application.Startup,
		OnShutdown:         application.Shutdown,
		LogLevel:           logger.TRACE, // Level is controlled by logrus
		LogLevelProduction: logger.TRACE,
		Logger:             appLogger.Default(),
		Bind: []any{
			application,
			databaseService,
			authService,
			provisionerService,
			taskLogService,
			managementService,
			clusterGenerator,
		},
	})

	if err != nil {
		fmt.Println("Error: ", err.Error())
	}
}
