import * as jsdiff from "diff";
import * as color from "ansi-colors";
import { PackageStateCapture } from "../../../src/Test/PackageStateCapture";

class FileStateChanges {
    constructor(public pkgName: string, public fileName: string, public diff: Change[]) { }

    hasChanges() { return this.diff.length > 1; }

    colorText(mode: "full"|"summary"|"minimal") {
        return colorSummary(this.diff, mode);
    }
}

class WorkspaceStateChanges {
    constructor(public fileChanges: FileStateChanges[]) { }

    getChanges(mode: "full"|"summary"|"minimal") {
        return this.fileChanges.filter(x => mode === "full" ? true : x.hasChanges())
            .map(x => `${color.bgBlue(` === ${x.fileName} === `)}\n${x.colorText(mode)}`).join("\n\n");
    }

    static diff(before: PackageStateCapture, after: PackageStateCapture): WorkspaceStateChanges {
        const result: FileStateChanges[] = [];
        for (const file of Object.keys(after.overviews)) {
            const diff = cleverDiff(before.overviews[file], after.overviews[file]);
            result.push(new FileStateChanges(after.pkg.name, file, diff));
        }
        return new WorkspaceStateChanges(result);
    }
}

enum ChangeType { Added = "Added", Removed = "Removed", SameText = "SameText", SameBlock = "SameBlock" }

class Change {
    constructor(public type: ChangeType, public value: string) { }
}

export function cleverDiff(str1: string, str2: string): Change[] {
    const result: Change[] = [];

    const jsChanges = jsdiff.diffLines(str1, str2);
    for (let i = 0; i < jsChanges.length; i++) {
        const jsCh = jsChanges[i];
        const jsChNext = jsChanges[i + 1] || <jsdiff.Change>{};
        if (jsCh.removed && jsChNext.added) {
            const lineDiff = jsdiff.diffWords(jsCh.value, jsChNext.value);
            for (const part of lineDiff)
                result.push(new Change(part.added ? ChangeType.Added : part.removed ? ChangeType.Removed : ChangeType.SameText, part.value));
            i++;
        } else if (jsCh.removed) {
            result.push(new Change(ChangeType.Removed, jsCh.value));
        } else if (jsCh.added) {
            result.push(new Change(ChangeType.Added, jsCh.value));
        } else {
            result.push(new Change(ChangeType.SameBlock, jsCh.value));
        }
    }

    return result;
}

export function colorSummary(diff: Change[], mode: "full"|"summary"|"minimal"): string {
    return diff.map((ch, i) => {
        if(ch.type === ChangeType.Added) {
            return color.green(ch.value);
        } else if(ch.type === ChangeType.Removed) {
            return color.red(ch.value);
        } else if(ch.type === ChangeType.SameText) {
            return ch.value;
        } else if(ch.type === ChangeType.SameBlock) {
            if (mode === "full") {
                return ch.value;
            } else {
                const last = i === diff.length - 1;
                if (mode === "minimal" && (i === 0 || last)) return "";

                const nlOffs = ch.value.indexOf("\n");
                if (nlOffs === -1 || nlOffs === ch.value.length - 1)
                    return ch.value;
                return "...\n";
            }
        }
    }).join("");
}