const allTests = ["TemplateTest", "ParserTest", /*"GeneratedCodeParser",*/ "CompilationTest"];
const testsToRun = process.argv.length > 2 ? [process.argv[2]] : allTests;
for (const testName of testsToRun) {
    if (!allTests.includes(testName)) {
        console.error(`Test not found: ${testName}`);
        continue;
    }
    
    require(`./${testName}`);
}
