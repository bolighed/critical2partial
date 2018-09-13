
.PHONY: build-image


build-image:
	docker build --tag bolighed-critical-image -f docker/Dockerfile .

build:
	node_modules/.bin/tsc