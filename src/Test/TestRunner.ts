import { One } from "One.Core-v0.1";
import { CompilerHelper } from "../One/CompilerHelper";
import { ITestCollection, TestCase } from "./TestCase";
import { BasicTests } from "./TestCases/BasicTests";
import { ProjectGeneratorTest } from "./TestCases/ProjectGeneratorTest";

export class TestRunner {
    tests: ITestCollection[] = [];
    argsDict: { [name: string]: string } = {};
    outputDir: string;

    constructor(public baseDir: string, public args: string[]) {
        CompilerHelper.baseDir = `${baseDir}/`;
        this.tests.push(new BasicTests());
        this.tests.push(new ProjectGeneratorTest(this.baseDir));

        this.parseArgs();
        this.outputDir = this.argsDict["output-dir"] || `${baseDir}/test/artifacts/TestRunner/${One.langName()}`;
    }

    parseArgs(): void {
        for (let i = 0; i < this.args.length - 1; i++)
            if (this.args[i].startsWith("--"))
                this.argsDict[this.args[i].substr(2)] = this.args[i + 1];
    }

    async runTests(): Promise<void> {
        console.log(`### TestRunner -> START ###`);
        
        for (const coll of this.tests) {
            console.log(`### TestCollection -> ${coll.name} -> START ###`);
            for (const test of coll.getTestCases()) {
                console.log(`### TestCase -> ${test.name} -> START ###`);
                try {
                    const outputDir = `${this.outputDir}/${coll.name}/${test.name}/`;
                    console.log(`### TestCase -> ${test.name} -> OUTPUT-DIR -> ${outputDir} ###`);
                    await test.action(outputDir);
                } catch(e) { 
                    console.log(`### TestCase -> ${test.name} -> ERROR -> ${(<Error>e).message} ###`);
                }
                console.log(`### TestCase -> ${test.name} -> END ###`);
            }
            console.log(`### TestCollection -> ${coll.name} -> END ###`);
        }
        
        console.log(`### TestRunner -> END ###`);
    }
}