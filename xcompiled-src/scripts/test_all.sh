run() {
    set -o pipefail
    script -q /dev/null $(printf "%q " "$@") | grep -v "matches\|passed"
}

cd ../../xcompiled

echo ======================= JAVASCRIPT =======================
run node --unhandled-rejections=strict ../test/lib/SelfTest.js
JS=$?
echo

echo ======================= PHP =======================
pushd PHP > /dev/null
composer dump-autoload
run php main.php
PHP=$?
popd > /dev/null
echo

echo ======================= C# =======================
pushd CSharp > /dev/null
run dotnet run
CS=$?
popd > /dev/null
echo

echo ======================= PYTHON =======================
pushd Python > /dev/null
run python3 main.py
PYTHON=$?
popd > /dev/null
echo

echo ======================= JAVA =======================
pushd Java > /dev/null
run ./gradlew run
JAVA=$?
popd > /dev/null
echo

echo JS = $JS, PHP = $PHP, C# = $CS, PYTHON = $PYTHON, JAVA = $JAVA
