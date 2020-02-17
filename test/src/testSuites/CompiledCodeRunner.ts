import 'module-alias/register';
import { getCompilationTestPrgNames, getLangFiles, readFile, jsonRequest, assert, getYamlTestSuite, timeNow } from '../TestUtils';
import { PackageManager } from '@one/StdLib/PackageManager';
import { PackagesFolderSource } from '@one/StdLib/PackagesFolderSource';

//const filter: RegExp = /cpp:(ArrayTest|HelloWorld|HelloWorldRaw)/;
const filter: RegExp = /StrLenInferIssue:cpp/;
const todoFilter: RegExp = /BigInteger:cpp/;

const backendUrl = "http://127.0.0.1:11111";
const expectedResults: { [prgName: string]: string } = getYamlTestSuite("CompiledCodeRunner");
const prgs = getCompilationTestPrgNames();
const langs = getLangFiles();

const pacMan = new PackageManager(new PackagesFolderSource(`${__dirname}/../../../packages`));
before(async () => await pacMan.loadAllCached());

// init compiler backend
jsonRequest(`${backendUrl}/api/status`, null);

for (const prg of prgs) {
    describe(prg, () => {
        for (const lang of langs) {
            if (filter && !filter.exec(`${prg}:${lang.name}`)) continue;
            if (todoFilter && todoFilter.exec(`${prg}:${lang.name}`)) continue;
            const [mainClass, mainMethod] = (lang.main || "").split('.');
            it(lang.name, async function() {
                this.timeout(5000);
                const sourceCode = readFile(`test/artifacts/CompilationTest/${prg}/results/${prg}.${lang.extension}`);
                const nativeImpl = pacMan.getLangNativeImpls(lang.name);
                const packageSources = nativeImpl.map(x => ({ packageName: `${x.pkgVendor}-${x.pkgName}-v${x.pkgVersion}`, fileName: x.fileName, code: x.code }));
                const request: CompileRequest = { lang: lang.name, code: sourceCode, packageSources, className: mainClass, methodName: mainMethod };
                console.log(request.code.split('\n\n')[0], request.packageSources.map(x => `${x.packageName}:${x.fileName}`));
                let res = await jsonRequest<CompileResult>(`${backendUrl}/compile?useCache`, request);
                
                if (res.exceptionText && res.fromCache)
                    res = await jsonRequest<CompileResult>(`${backendUrl}/compile`, request);

                if (res.exceptionText)
                    throw new Error(`Compilation failed (${res.tmpDir||res.cacheId}): ${res.exceptionText}\nOutput: ${res.result}`);

                const expected = expectedResults[`${prg}-${lang.name}`] || expectedResults[prg];
                if (typeof expected === "undefined") {
                    if (lang.name === "javascript")
                        console.error(`Expected result was not set for program "${prg}", current result is ${JSON.stringify(res.result)}`);
                } else
                    assert.equal(res.result, expected, `Result was incorrect (${res.tmpDir||res.cacheId})`);
            })
        }
    })
}

interface CompileRequest {
    lang?: string;
    code: string;
    packageSources?: {
        packageName: string;
        fileName: string;
        code: string;
    }[];
    className?: string;
    methodName?: string;
}

interface CompileResult {
    result?: string;
    elapsedMs?: number;
    exceptionText?: string;
    fromCache: boolean;
    cacheId: string;
    tmpDir: string;
}
