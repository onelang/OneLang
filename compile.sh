./node_modules/typescript/bin/tsc

cd FastCompile/Java
mvn compile

cd ../..

mkdir tmp
mkdir tmp/FastCompile
mkdir FastCompile/Java/lib/
cp ~/.m2/repository/com/google/code/gson/gson/2.8.1/gson-2.8.1.jar FastCompile/Java/lib/
