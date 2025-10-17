.PHONY: all deps build release clean test

NODE_GYP := $(shell npm bin)/node-gyp

all: build

deps:
	npm install --prefix . node-addon-api

build: deps
	$(NODE_GYP) configure build --directory .

release: deps
	$(NODE_GYP) configure build --release --directory .

clean:
	rm -rf build *.node

test: release
	node -e "require('./build/Release/security_tree_addon.node')"
	echo "SecurityTree module loaded successfully."
