import { spawn } from 'child_process';
import { Readable } from 'stream';
import * as color from "ansi-colors";

export class OutputReader {
    metaStart = "### ";
    metaEnd = " ###\n";
    metaPartSeparator = " -> ";

    constructor(public input: Readable, public onMetadata: (parts: string[]) => void, public onData: (str: string) => void) {
        input.on('data', data => this.onInputData(data.toString('utf-8')));
    }

    onInputData(inputData: string) {
        let data = inputData;
        while (true) {
            const metaPos = data.indexOf(this.metaStart);
            if (metaPos === -1) {
                if (data !== "")
                    this.onData(data);
                break;
            }

            const dataPart = data.substring(0, metaPos);
            if (dataPart !== "")
                this.onData(dataPart);

            const metaStart = metaPos + this.metaStart.length;
            const metaEnd = data.indexOf(this.metaEnd, metaStart);
            const metaPart = data.substring(metaStart, metaEnd);
            this.onMetadata(metaPart.split(this.metaPartSeparator));
            data = data.substring(metaEnd + this.metaEnd.length);
        }
    }
}

function pad(str: string): string { return str.split(/\n/g).map(x => `    ${x}`).join('\n'); }

class ExposedPromise<T> {
    resolvedValue: T = null;
    rejectReason: any = null;

    onResolved = (value: T) => { this.resolvedValue = value; }
    onReject = (reason: any) => { this.rejectReason = reason; }

    get() {
        return new Promise<T>((resolve, reject) => {
            if (this.resolvedValue !== null)
                resolve(this.resolvedValue);
            else if (this.rejectReason !== null)
                reject(this.rejectReason);
            else {
                this.onResolved = resolve;
                this.onReject = reject;
            }
        });
    }
}

class TestResult {
    constructor(public collectionName: string, public testName: string, public output: string = "", public error: string = null, public outputDir: string = null) { }
}

class TestRunnerResult {
    constructor(public testResults: TestResult[], public stderr: string, public exitCode: number, public signal: string) { }
}

class TestRunnerHandler {
    stderr = "";
    currColl = "?";
    currTest: TestResult = null;
    testResults: TestResult[] = [];
    runPromise: ExposedPromise<TestRunnerResult>;

    constructor(public commandLine: string) { }

    onMeta(meta: string[]) { 
        const component = meta.shift();
        const itemName = meta.shift();
        const action = meta.shift() ?? itemName;
        if (component === "TestRunner" && action === "START") {
            console.log(color.gray('TestRunner started.'));
        } else if (component === "TestRunner" && action === "END") {
            console.log(color.gray('TestRunner finished.'));
        } else if (component === "TestCollection" && action === "START") {
            this.currColl = itemName;
            console.log(`  ${color.bold(color.greenBright(this.currColl))} ${color.grey("(collection)")}`);
        } else if (component === "TestCollection" && action === "END") {
            this.currColl = null;
        } else if (component === "TestCase" && action === "START") {
            this.currTest = new TestResult(this.currColl, itemName);
            process.stdout.write(`    ${this.currTest.testName}: `);
        } else if (component === "TestCase" && action === "OUTPUT-DIR") {
            this.currTest.outputDir = meta[0];
        } else if (component === "TestCase" && action === "END") {
            this.testResults.push(this.currTest);
            this.currTest = null;
            process.stdout.write(` ${color.bold(color.green("✔"))}\n`);
        } else if (component === "TestCase" && action === "ERROR") {
            this.currTest.error = meta[0];
            console.log(`    ${color.red("Error:")}\n${pad(pad(this.currTest.error))}`);
        } else {
            console.log(`${color.red("Unhandled meta action:")} ${color.bold(action)} on component ${color.bold(component)}`);
        }
    }

    onData(data: string) {
        process.stdout.write('.');
        this.currTest.output += data;
    }

    onStdErr(data: string) {
        this.stderr += data;
        console.log(`${color.red("STDERR:")} ${data}`);
    }

    onProcessExited(code: number, signal: string) {
        if (code === 0 && signal === null)
            console.log(color.gray(`TestRunner exited successfully.`));
        else
            console.log(`${color.red("TestRunner failed")} with exit code ${color.bold(`${code}`)} and signal ${color.bold(`${signal}`)}`);

        this.runPromise.onResolved(new TestRunnerResult(this.testResults, this.stderr, code, signal));
    }

    async run() {
        const cmdArgs = this.commandLine.split(' ');
        const cmdName = cmdArgs.shift();
        const proc = spawn(cmdName, cmdArgs);

        new OutputReader(proc.stdout, meta => this.onMeta(meta), data => this.onData(data));
        proc.stderr.on('data', data => this.onStdErr(data.toString("utf-8")));

        this.runPromise = new ExposedPromise<TestRunnerResult>();
        proc.on('close', (code, signal) => this.onProcessExited(code, signal));
        return this.runPromise.get();
    }
}

export class CrossCompiledTestRunner {
    async run() {
        const testResults = await new TestRunnerHandler(`node --unhandled-rejections=strict ${__dirname}/SelfTest.js`).run();
    }
}

if (require.main === module)
    new CrossCompiledTestRunner().run();