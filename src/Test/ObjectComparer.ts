import { _ } from "./Underscore";

export class ObjectComparer {
    issues: string[] = [];

    constructor(expected: any, value: any) {
        this.compare([], expected, value);
    }

    addIssue(path: string[], text: string) {
        this.issues.push(`/${path.join('/')}: ${text}`);
    }

    compare(path: string[], expected: any, value: any) {
        if (typeof value !== typeof expected) {
            this.addIssue(path, `expected type '${typeof expected}', got '${typeof value}'`);
        } else if (typeof expected === "object" && Array.isArray(expected)) {
            const expectedArr = <any[]> expected;
            const valueArr = <any[]> value;
            if (expectedArr.length !== valueArr.length)
                this.addIssue(path, `expected array with '${expectedArr.length}' items, got '${valueArr.length}'`);
            else {
                for (let i = 0; i < expectedArr.length; i++)
                    this.compare([...path, `${i}`], expectedArr[i], valueArr[i]);
            }
        } else if (typeof expected === "object" && expected !== null && value !== null) {
            const expectedKeys = Object.keys(expected);
            const valueKeys = Object.keys(value);

            const unexpectedKeys = _.except(valueKeys, expectedKeys);
            if (unexpectedKeys.length > 0)
                this.addIssue(path, `the following keys are not expected: ${unexpectedKeys.join(', ')}`);

            const missingKeys = _.except(expectedKeys, valueKeys);
            if (missingKeys.length > 0)
                this.addIssue(path, `the following keys missing: ${missingKeys.join(', ')}`);

            for (const key of _.intersect(expectedKeys, valueKeys))
                this.compare([...path, key], expected[key], value[key]);
        } else if (value !== expected) {
            this.addIssue(path, `expected value '${expected}', got '${value}'`);
        } else if (value === expected) {
        } else { 
            this.addIssue(path, `unknown issue (should not happen)`);
        }
    }

    generateSummary() {
        return this.issues.length === 0 ? 'equals' : 
            "issues:\n" + this.issues.map(x => ` - ${x}`).join("\n");
    }

    static getFullSummary(expected: any, valueGetter: () => any) {
        try {
            const value = valueGetter();
            
            const summary = new ObjectComparer(expected, value).generateSummary();
            if (summary === "equals")
                return `OK`;
            else
                return `${summary}\n  Expected: ${JSON.stringify(expected)}\n  Got:      ${JSON.stringify(value)}`;
        } catch(e) {
            return `Exception: ${e}`;
        }
    }
}