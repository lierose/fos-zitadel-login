SHELL := /bin/sh

IMAGE ?= registry.liero.se/ifa-zitadel-login-v2
TAG ?= latest
PLATFORM ?= linux/amd64
PLATFORMS ?= linux/amd64,linux/arm64
SMOKE_PORT ?= 3100
PNPM ?= npx --yes pnpm@10.28.2

GIT_SHA := $(shell git rev-parse --short=12 HEAD)
ARCH := $(patsubst linux/%,%,$(PLATFORM))
IMAGE_REF := $(IMAGE):$(TAG)
SHA_REF := $(IMAGE):git-$(GIT_SHA)
LOCAL_SHA_REF := $(SHA_REF)-$(ARCH)
SMOKE_CONTAINER := ifa-zitadel-login-v2-smoke

.PHONY: help install check app-build build image image-amd64 image-arm64 push smoke smoke-arm64 clean-smoke

help:
	@echo "make install       Install locked dependencies"
	@echo "make check         Run lint, format, types and unit tests"
	@echo "make app-build     Build the standalone Next.js application"
	@echo "make image         Build $(IMAGE_REF) for $(PLATFORM)"
	@echo "make image-amd64   Build a local $(TAG)-amd64 image"
	@echo "make image-arm64   Build a local $(TAG)-arm64 image"
	@echo "make smoke         Verify root health routes and rejected legacy prefixes"
	@echo "make smoke-arm64   Build and smoke-test the local ARM64 image"
	@echo "make push          Build and push one multi-arch tag for $(PLATFORMS)"
	@echo "Overrides: TAG=<tag> PLATFORM=<platform> PLATFORMS=<list> IMAGE=<registry/repository>"

install:
	$(PNPM) install --frozen-lockfile

check:
	$(PNPM) lint-check-next
	$(PNPM) lint-check-prettier
	$(PNPM) typecheck
	$(PNPM) test-unit

app-build:
	$(PNPM) build

build: image

image:
	docker buildx build \
		--platform $(PLATFORM) \
		--build-arg VERSION=$(TAG) \
		--build-arg REVISION=$(GIT_SHA) \
		--tag $(IMAGE_REF) \
		--tag $(LOCAL_SHA_REF) \
		--load \
		.

image-amd64:
	$(MAKE) image PLATFORM=linux/amd64 TAG=$(TAG)-amd64

image-arm64:
	$(MAKE) image PLATFORM=linux/arm64 TAG=$(TAG)-arm64

push:
	docker buildx build \
		--platform $(PLATFORMS) \
		--build-arg VERSION=$(TAG) \
		--build-arg REVISION=$(GIT_SHA) \
		--tag $(IMAGE_REF) \
		--tag $(SHA_REF) \
		--push \
		.

smoke: image clean-smoke
	@set -eu; \
		docker run --detach --rm \
			--platform $(PLATFORM) \
			--name $(SMOKE_CONTAINER) \
			--publish 127.0.0.1:$(SMOKE_PORT):3000 \
			--env ZITADEL_API_URL=http://host.docker.internal:8080 \
			--env ZITADEL_SERVICE_USER_TOKEN=smoke-test-only \
			$(IMAGE_REF) >/dev/null; \
		trap 'docker container rm --force $(SMOKE_CONTAINER) >/dev/null 2>&1 || true' EXIT INT TERM; \
		curl --retry 15 --retry-all-errors --retry-delay 1 --fail --silent \
			http://127.0.0.1:$(SMOKE_PORT)/healthy >/dev/null; \
		test "$$(curl --silent --output /dev/null --write-out '%{http_code}' \
			http://127.0.0.1:$(SMOKE_PORT)/ui/v2/login/healthy)" = "404"; \
		test "$$(curl --silent --output /dev/null --write-out '%{http_code}' \
			http://127.0.0.1:$(SMOKE_PORT)/v2/login/healthy)" = "404"; \
		echo "Root /healthy is ready; legacy /ui/v2/login and /v2/login prefixes are not served."

smoke-arm64:
	$(MAKE) smoke PLATFORM=linux/arm64 TAG=$(TAG)-arm64

clean-smoke:
	@docker container rm --force $(SMOKE_CONTAINER) >/dev/null 2>&1 || true
