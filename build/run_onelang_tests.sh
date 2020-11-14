faketty() {
    script -q /dev/null $(printf "%q " "$@")
}

run() {
    set -o pipefail
    script -q /dev/null $(printf "%q " "$@") | grep -v matches
}

cd ..

echo ======================= JAVASCRIPT =======================
run node --unhandled-rejections=strict ./test/lib/SelfTest.js
JS=$?
echo

echo ======================= PHP =======================
pushd ./test/artifacts/ProjectTest/OneLang/PHP > /dev/null
run php main.php
PHP=$?
popd > /dev/null
echo

echo ======================= C# =======================
pushd ./test/artifacts/ProjectTest/OneLang/CSharp > /dev/null
run dotnet run
CS=$?
popd > /dev/null
echo

echo ======================= PYTHON =======================
pushd ./test/artifacts/ProjectTest/OneLang/Python > /dev/null
run python3 main.py
PYTHON=$?
popd > /dev/null
echo

echo JS = $JS, PHP = $PHP, C# = $CS, PYTHON = $PYTHON
