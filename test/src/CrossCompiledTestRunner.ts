import { spawn } from 'child_process';
import { Readable } from 'stream';
import * as color from "ansi-colors";
import * as fs from "fs";
import { OneFile } from 'One.File-v0.1';
import { cleverDiff, colorSummary } from './Utils/DiffUtils';

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

function pad(str: string, pad = "    "): string { return str.split(/\n/g).map(x => `${pad}${x}`).join('\n'); }

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
    output = "";
    error: string = null;
    outputDir: string = null;
    checkResult: CheckResult = null;

    constructor(public collectionName: string, public testName: string) { }
}

class TestRunnerResult {
    constructor(public testResults: TestResult[], public stderr: string, public exitCode: number, public signal: string) { }
}

class CheckResult { 
    constructor(public passed: boolean, public notes: string = null) { }
}

class TestRunnerHandler {
    stdout = "";
    stderr = "";
    currColl = "?";
    currTest: TestResult = null;
    testResults: TestResult[] = [];
    runPromise: ExposedPromise<TestRunnerResult>;

    constructor(public commandLine: string, public workingDir, public resultChecker: (result: TestResult) => CheckResult = null) { }

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
            this.currTest.checkResult = this.resultChecker === null ? null : this.resultChecker(this.currTest);
            if (this.currTest.checkResult === null || this.currTest.checkResult.passed)
                process.stdout.write(` ${color.bold(color.green("✔"))}\n`);
            else
                process.stdout.write(` ${color.bold(color.redBright("✗"))}\n`);

            if (this.currTest.checkResult?.notes)
                console.log(`${pad(this.currTest.checkResult.notes, "      ")}`);

            this.testResults.push(this.currTest);
            this.currTest = null;
        } else if (component === "TestCase" && action === "ERROR") {
            this.currTest.error = meta[0];
            console.log(`    ${color.red("Error:")}\n${pad(this.currTest.error, "      ")}`);
        } else {
            console.log(`${color.red("Unhandled meta action:")} ${color.bold(action)} on component ${color.bold(component)}`);
        }
    }

    onData(data: string) {
        if (this.currTest !== null) {
            process.stdout.write('.');
            this.currTest.output += data;
        } else {
            console.log(`${color.yellow("STDOUT:")} ${data.trim()}`);
            this.stdout += data;
        }
    }

    onStdErr(data: string) {
        this.stderr += data;
        console.log(`${color.red("STDERR:")} ${data.trim()}`);
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
        const proc = spawn(cmdName, cmdArgs, { cwd: this.workingDir });

        new OutputReader(proc.stdout, meta => this.onMeta(meta), data => this.onData(data));
        proc.stderr.on('data', data => this.onStdErr(data.toString("utf-8")));

        this.runPromise = new ExposedPromise<TestRunnerResult>();
        proc.on('close', (code, signal) => this.onProcessExited(code, signal));
        return this.runPromise.get();
    }
}

function glob(dir: string, result: string[] = [], path = '') {
    const fullPath = `${dir}/${path}`;
    for (const entry of fs.readdirSync(fullPath)) {
        const isDir = fs.statSync(`${fullPath}/${entry}`).isDirectory();
        if (isDir)
            glob(dir, result, `${path}${entry}/`);
        else
            result.push(`${path}${entry}`);
    }
    return result;
}

export class CrossCompiledTestRunner {
    jsResults: { [name: string]: TestResult } = {};

    jsResultCallback(result: TestResult): CheckResult {
        const resultFiles = fs.existsSync(result.outputDir) ? glob(result.outputDir) : [];
        return new CheckResult(true, resultFiles.length > 0 ? color.yellow(`${resultFiles.length} files were generated.`) : null);
    }

    checkResult(result: TestResult): CheckResult {
        const js = this.jsResults[`${result.collectionName}.${result.testName}`] || null;
        if (js === null) return new CheckResult(false, color.red("JS test results are missing!"));

        const jsFiles = fs.existsSync(js.outputDir) ? glob(js.outputDir) : [];
        const resultFiles = fs.existsSync(result.outputDir) ? glob(result.outputDir) : [];

        let diffSummary = "";
        const addDiff = (name: string, expected: string, result: string) => {
            if (result === expected) return;
            diffSummary += `${color.yellow(name)}:\n${pad(colorSummary(cleverDiff(result, expected), "minimal"))}\n`;
        };

        addDiff("Stdout", js.output, result.output);
        addDiff("Generated files", jsFiles.join("\n"), resultFiles.join("\n"));
        for (const file of jsFiles) {
            if (resultFiles.indexOf(file) === -1) continue;
            const jsContent = fs.readFileSync(`${js.outputDir}/${file}`, 'utf-8');
            const resultContent = fs.readFileSync(`${result.outputDir}/${file}`, 'utf-8');
            addDiff(file, jsContent, resultContent);
        }

        return new CheckResult(diffSummary === "", diffSummary);
    }

    async run() {
        const baseDir = `${__dirname}/../..`;
        const outputDirArg = `--output-dir ${__dirname}/../artifacts/SelfTestRunner`;
        console.log(color.bgBlue(color.white("  ===  JavaScript (baseline)  ===  ")));
        const jsResult = await new TestRunnerHandler(`node --unhandled-rejections=strict SelfTest.js ${outputDirArg}/JS`, `${baseDir}/test/lib`, result => this.jsResultCallback(result)).run();
        for (const result of jsResult.testResults)
            this.jsResults[`${result.collectionName}.${result.testName}`] = result;

        console.log(color.bgBlue(color.white("  ===  PHP  ===  ")));
        const phpResult = await new TestRunnerHandler(`php main.php ${outputDirArg}/PHP`, `${baseDir}/xcompiled/PHP`, result => this.checkResult(result)).run();
    }
}

if (require.main === module)
    new CrossCompiledTestRunner().run();