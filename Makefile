.PHONY: dev build clean

dev:
	python3 -m http.server 8000

dev-build: build
	echo "building and serving dest build"
	cd dist && python3 -m http.server 8080

node_modules: package.json
	npm install
	@touch node_modules

build: node_modules
	npm run build

clean:
	rm -rf dist
