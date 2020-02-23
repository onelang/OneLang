import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import * as assert from "assert";

function it2(fn: Mocha.Func) {
    it(fn.toString(), fn);
}

describe("TypeScriptParser2.calculateRelativePath", () => {
    function test(currFile: string, relPath: string, result: string|"throws") {
        if(result === "throws")
            it(`calculateRelativePath("${currFile}", "${relPath}") throws`, 
                () => assert.throws(() => TypeScriptParser2.calculateRelativePath(currFile, relPath)));
        else
           it(`calculateRelativePath("${currFile}", "${relPath}") === "${result}"`, 
                () => assert.equal(TypeScriptParser2.calculateRelativePath(currFile, relPath), result));
    }

    test("a", "b", "throws");
    test("a", "./b", "b");
    test("a", ".//b", "throws");
    test("a/b", "./c", "a/c");
    test("a/b", "../c", "c");
    test("a/b/c", "../d", "a/d");
    test("a/b/c", "../../d", "d");
    test("a/b/c", "../../../d", "throws");
});