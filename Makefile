.DEFAULT_GOAL := dev-up

COMPOSE := docker compose -f docker-compose.yml --project-name zitadel-login-dev

export ZITADEL_LOGIN_DISABLE_REGISTRATION ?= true
export ZITADEL_LOGIN_TITLE ?= Login to SwiftConnect
export NEXT_PUBLIC_BASE_PATH ?= /ui/v2/login
export NEXT_PUBLIC_APPLICATION_NAME ?= SwiftConnect
export NEXT_PUBLIC_THEME_ROUNDNESS ?= mid
export NEXT_PUBLIC_THEME_LAYOUT ?= top-to-bottom
export NEXT_PUBLIC_THEME_APPEARANCE ?= glass
export NEXT_PUBLIC_THEME_SPACING ?= compact
export NEXT_PUBLIC_THEME_BACKGROUND_IMAGE ?=

.PHONY: dev-build dev-up dev-up-logs dev-down dev-clean dev-logs dev-ps dev-restart login-test

dev-build:
	NX_DAEMON=false pnpm nx run @zitadel/api:pack
	NX_DAEMON=false NX_SKIP_NX_CACHE=true pnpm nx run @zitadel/login:pack

dev-up: dev-build
	$(COMPOSE) up -d --wait

dev-up-logs: dev-build
	$(COMPOSE) up

dev-down:
	$(COMPOSE) down --remove-orphans

dev-clean:
	$(COMPOSE) down --volumes --remove-orphans

dev-logs:
	$(COMPOSE) logs -f

dev-ps:
	$(COMPOSE) ps

dev-restart: dev-down dev-up

login-test:
	pnpm -C apps/login exec vitest --run
