mkdir lib
./node_modules/browserify/bin/cmd.js node_modules/ts-simple-ast/dist/TsSimpleAst.js --external typescript -e node_modules/ts-simple-ast/dist/main.js -s TsSimpleAst -o lib/TsSimpleAst.js
./node_modules/browserify/bin/cmd.js node_modules/typescript/lib/typescript.js --external source-map-support -s typescript -o lib/typescript.js
