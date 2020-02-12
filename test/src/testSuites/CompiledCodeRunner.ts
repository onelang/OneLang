import 'module-alias/register';
import { getCompilationTestPrgNames, getLangFiles, readFile, jsonRequest, assert } from '../TestUtils';

export interface CompileResult {
    result?: string;
    elapsedMs?: number;
    exceptionText?: string;
}

//const prgs = getCompilationTestPrgNames();
const prgs = ["HelloWorldRaw"];
const langs = getLangFiles();
for (const prg of prgs) {
    describe(prg, () => {
        for (const langName of Object.keys(langs)) {
            const lang = langs[langName];
            const [mainClass, mainMethod] = (lang.main || "").split('.');
            it(langName, async () => {
                const sourceCode = readFile(`test/artifacts/CompilationTest/${prg}/results/${prg}.${lang.extension}`);
                const request = { lang: langName, code: sourceCode, packageSources: [], className: mainClass, methodName: mainMethod };
                const result = await jsonRequest<CompileResult>(`http://127.0.0.1:11111/compile?useCache`, request);
                if (result.exceptionText)
                    throw new Error(result.exceptionText);
            })
        }
    })
}