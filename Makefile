.PHONY: build deploy watch

build deploy:
	rm -rf build
	mkdir -p build
	rsync -a --exclude \*.swp --exclude .module-cache Chrome/ build/
	<src/index.js jsx | closure-compiler --third_party --js - > build/index.js
	<Chrome/piggyback.js closure-compiler --third_party --js - > build/piggyback.js
	cd build && zip destinygear.zip -r . -x \*.swp -x .module-cache/\*
	mv build/destinygear.zip .

watch:
	jsx --watch src/ Chrome/
