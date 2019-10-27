.PHONY: reset test

reset:
	rm -rf node_modules
	rm -rf build
	rm -rf test
	rm -rf coverage

install: reset
	yarn install

fix:
	yarn run fix

test: fix
	yarn run cov

test-ci:
	yarn run test
	yarn run cov:check	

watch:
	yarn run watch

doc:
	rm -rf build/docs; yarn run doc:html; yarn run doc:json;

build: install test-ci doc

publish-doc:
	yarn run doc:publish

publish:
	yarn run version; git push --follow-tags origin master; npm publish
