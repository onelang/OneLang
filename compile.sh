./node_modules/typescript/bin/tsc

cd FastCompile/Java
mvn compile
mkdir lib/
cp ~/.m2/repository/com/google/code/gson/gson/2.8.1/gson-2.8.1.jar lib/
cd ../..

cd FastCompile/CSharp
dotnet build
cd ../..

mkdir tmp
mkdir tmp/FastCompile
