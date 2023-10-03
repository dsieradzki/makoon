SHELL := /bin/bash

.PHONY:
.ONESHELL:
clean:
	rm src-web/src/api -rfv
	rm src-web/dist -rfv
	rm src-web/node_modules -rfv

.PHONY:
.ONESHELL:
build: web.install web.generate-models web.build app.build.release

.PHONY:
.ONESHELL:
web.generate-models:
	typeshare ./src --lang=typescript -c ./typeshare.toml --output-file=src-web/src/api/model.ts

.PHONY:
.ONESHELL:
web.install:
	. ${HOME}/.nvm/nvm.sh && nvm use --lts
	cd src-web
	pnpm install

.PHONY:
.ONESHELL:
web.build:
	. ${HOME}/.nvm/nvm.sh && nvm use --lts
	cd src-web
	pnpm build

.PHONY:
.ONESHELL:
app.build.release:
	cargo build --release

.PHONY:
.ONESHELL:
app.build.debug:
	cargo build
