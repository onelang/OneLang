echo
echo '    ===> Building OneLang <==='
echo
npm i
./node_modules/typescript/bin/tsc
echo 'Done.'

pushd CompilerBackend > /dev/null
./compile.sh
popd > /dev/null
echo
echo 'All built. Now run ./serve.py'