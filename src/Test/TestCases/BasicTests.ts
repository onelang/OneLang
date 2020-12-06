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

    getTestCases(): TestCase[] {
        return [
            new SyncTestCase("PrintsOneLineString", _ => this.printsOneLineString()),
            new SyncTestCase("PrintsMultiLineString", _ => this.printsMultiLineString()),
            new SyncTestCase("PrintsTwoStrings", _ => this.printsTwoStrings())
        ];
    }
}