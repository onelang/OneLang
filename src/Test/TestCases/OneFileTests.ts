// @php-use OneLang\File\OneFile
// @python-import-all onelang_file
import { OneFile } from "One.File-v0.1";

import { ITestCollection, SyncTestCase, TestCase } from "../TestCase";

export class OneFileTests implements ITestCollection {
    name = "OneFileTests";

    constructor(public baseDir: string) { }

    listXCompiledNativeSources() {
        console.log(OneFile.listFiles(`${this.baseDir}/xcompiled-src/native`, true).join("\n"));
    }

    getTestCases(): TestCase[] {
        return [
            new SyncTestCase("ListXCompiledNativeSources", _ => this.listXCompiledNativeSources())
        ];
    }
}