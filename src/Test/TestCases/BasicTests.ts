import { ITestCollection, SyncTestCase, TestCase } from "../TestCase";

export class BasicTests implements ITestCollection {
    name = "BasicTests";
    
    printsOneLineString() {
        console.log("Hello World!");
    }

    printsMultiLineString() {
        console.log("Hello\nWorld!");
    }

    printsTwoStrings() {
        console.log("Hello");
        console.log("HelloWorld!");
    }

    printsEscapedString() {
        console.log("dollar: $");
        console.log("backslash: \\");
        console.log("newline: \n");
        console.log("escaped newline: \\n");
        console.log("dollar after escape: \\$");
    }

    printsEscapedTemplateString() {
        console.log(`dollar: $`);
        console.log(`backslash: \\`);
        console.log(`newline: \n`);
        console.log(`escaped newline: \\n`);
        console.log(`dollar after escape: \\$`);
    }

    regexReplace() {
        console.log("a$b$c".replace(/\$/g, "x"));
        console.log("Test1: xx".replace(/x/g, "$"));
        console.log("Test2: yy".replace(/y/g, "\\"));
        console.log("Test3: zz".replace(/z/g, "\\$"));
    }

    json() {
        console.log(JSON.stringify(null));
        console.log(JSON.stringify(true));
        console.log(JSON.stringify(false));
        console.log(JSON.stringify("string"));
        console.log(JSON.stringify(0.123));
        console.log(JSON.stringify(123));
        console.log(JSON.stringify(123.456));
        console.log(JSON.stringify({ a: "b" }));
        console.log(JSON.stringify("$"));
        console.log(JSON.stringify("A \\ B"));
        console.log(JSON.stringify("A \\\\ B"));
    }

    phpGeneratorBugs() {
        console.log("Step1: " + "A $ B");
        console.log("Step2: " + JSON.stringify("A $ B"));
        console.log("Step3: " + JSON.stringify("A $ B").replace(/\$/g, "\\$"));
        console.log("Step3 w/o JSON: " + "A $ B".replace(/\$/g, "\\$"));
        // for (const expr of ["A $ B", "A \\ B", "A \\\\ B", "A \\$ B"]) 
        //     console.log(JSON.stringify(expr).replace(/\$/g, "\\$"));
    }

    getTestCases(): TestCase[] {
        return [
            new SyncTestCase("PrintsOneLineString", _ => this.printsOneLineString()),
            new SyncTestCase("PrintsMultiLineString", _ => this.printsMultiLineString()),
            new SyncTestCase("PrintsTwoStrings", _ => this.printsTwoStrings()),
            new SyncTestCase("PrintsEscapedString", _ => this.printsEscapedString()),
            new SyncTestCase("PrintsEscapedTemplateString", _ => this.printsEscapedTemplateString()),
            new SyncTestCase("RegexReplace", _ => this.regexReplace()),
            new SyncTestCase("Json", _ => this.json()),
            new SyncTestCase("PhpGeneratorBugs", _ => this.phpGeneratorBugs())
        ];
    }
}