
.PHONY: dev
dev:
	wails dev

.PHONY: build
build:
	wails build

.PHONY: generate
generate:
	wails generate module

.PHONY: test
test:
	go test -v ./internal/... ./pkg/...