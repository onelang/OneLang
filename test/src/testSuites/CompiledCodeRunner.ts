import 'module-alias/register';
import { getCompilationTestPrgNames, getLangFiles, readFile, jsonRequest, assert, getYamlTestSuite, timeNow, baseDir } from '../TestUtils';
import { PackageManager } from '@one/StdLib/PackageManager';
import { PackagesFolderSource } from '@one/StdLib/PackagesFolderSource';

//const filter: RegExp = /cpp:(ArrayTest|HelloWorld|HelloWorldRaw)/;
//const filter: RegExp = /:(cpp|csharp|java|javascript|python|ruby)$/;
const filter: RegExp = /:csharp$/;
const todoFilter: RegExp = /(BigInteger:cpp|JsonParseTest:cpp|:perl)$/;

const backendUrl = "http://127.0.0.1:11111";
const expectedResults: { [prgName: string]: string } = getYamlTestSuite("CompiledCodeRunner");
const prgs = getCompilationTestPrgNames();
const langs = getLangFiles();

const pacMan = new PackageManager(new PackagesFolderSource(`${baseDir}/packages`));
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

                const files = { [lang.mainFilename]: sourceCode };
                for (const f of pacMan.getLangNativeImpls(lang.name))
                    files[`${f.pkgVendor}-${f.pkgName}-v${f.pkgVersion}/${f.fileName}`] = f.code;

                const request: CompileRequest = { lang: lang.name, name: prg, files, mode: "native" };
                //console.log(request.code.split('\n\n')[0], request.packageSources.map(x => `${x.packageName}:${x.fileName}`));
                let res = await jsonRequest<CompileResult>(`${backendUrl}/compile?useCache`, request);

                //console.log(JSON.stringify(res, null, 4));
                if (!res.success || res.error)
                    throw new Error(`[${res.tmpDir||res.cacheId}]: ${res.error}`);

                //console.log(JSON.stringify(res));
                if (!res.success && res.fromCache)
                    res = await jsonRequest<CompileResult>(`${backendUrl}/compile`, request);

                if (!res.success)
                    throw new Error(`[${res.tmpDir||res.cacheId}]: ${res.error}`);

                const expected = expectedResults[`${prg}-${lang.name}`] || expectedResults[prg];
                if (typeof expected === "undefined") {
                    if (lang.name === "javascript")
                        console.error(`Expected result was not set for program "${prg}", current result is ${JSON.stringify(res.run.stdout)}`);
                } else
                    assert.equal(res.run.stdout, expected, `Result was incorrect (${res.tmpDir||res.cacheId})`);
            })
        }
    })
}

interface CompileRequest {
    lang?: string;
    code?: string;
    name: string;
    mode?: "auto"|"jsonRepl"|"server"|"native";
    packageSources?: {
        packageName: string;
        fileName: string;
        code: string;
    }[];
    files: { [name: string]: string };
    className?: string;
    methodName?: string;
}

interface CompileResult {
    elapsedMs?: number;
    fromCache: boolean;
    cacheId: string;
    tmpDir: string;
    error: string;
    success: boolean;
    compilation: { stdout: string; stderr: string; exitCode: number; success: boolean };
    run: { stdout: string; stderr: string; exitCode: number; success: boolean };
}
