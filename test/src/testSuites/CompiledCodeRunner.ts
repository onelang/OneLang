import 'module-alias/register';
import { getCompilationTestPrgNames, getLangFiles, readFile, jsonRequest, assert, getYamlTestSuite, timeNow } from '../TestUtils';

//const filter: RegExp = /cpp:(ArrayTest|HelloWorld|HelloWorldRaw)/;
const filter: RegExp = /:FileTest/;

const backendUrl = "http://127.0.0.1:11111";
const expectedResults: { [prgName: string]: string } = getYamlTestSuite("CompiledCodeRunner");
const prgs = getCompilationTestPrgNames();
const langs = getLangFiles();

// init compiler backend
jsonRequest(`${backendUrl}/api/status`, null);

for (const prg of prgs) {
    describe(prg, () => {
        for (const langName of Object.keys(langs)) {
            if (filter && !filter.exec(`${langName}:${prg}`)) continue;
            const lang = langs[langName];
            const [mainClass, mainMethod] = (lang.main || "").split('.');
            it(langName, async () => {
                const sourceCode = readFile(`test/artifacts/CompilationTest/${prg}/results/${prg}.${lang.extension}`);
                const request = { lang: langName, code: sourceCode, packageSources: [], className: mainClass, methodName: mainMethod };
                let res = await jsonRequest<CompileResult>(`${backendUrl}/compile?useCache`, request);
                
                if (res.exceptionText && res.fromCache)
                    res = await jsonRequest<CompileResult>(`${backendUrl}/compile`, request);

                if (res.exceptionText)
                    throw new Error(res.exceptionText);

                const expected = expectedResults[prg];
                if (typeof expected !== "undefined")
                    assert.equal(res.result, expected);
                else if (langName === "javascript")
                    console.error(`Expected result was not set for program "${prg}", current result is ${JSON.stringify(res.result)}`);
            })
        }
    })
}

interface CompileResult {
    result?: string;
    elapsedMs?: number;
    exceptionText?: string;
    fromCache: boolean;
}