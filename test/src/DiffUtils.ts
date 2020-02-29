import * as jsdiff from "diff";
import * as color from "ansi-colors";
import { Package } from "@one/One/Ast/Types";
import { TSOverviewGenerator } from "./TSOverviewGenerator";

class FileStateChanges {
    constructor(public pkgName: string, public fileName: string, public diff: Change[]) { }

    hasChanges() { return this.diff.length > 1; }

    colorText(mode: "full"|"summary"|"minimal") {
        return this.diff.map((ch, i) => {
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
                    const last = i === this.diff.length - 1;
                    if (mode === "minimal" && (i === 0 || last)) return "";

                    const nlOffs = ch.value.indexOf("\n");
                    if (nlOffs === -1 || nlOffs === ch.value.length - 1)
                        return ch.value;
                    return "...\n";
                }
            }
        }).join("");
    }
}

class WorkspaceStateChanges {
    constructor(public fileChanges: FileStateChanges[]) { }

    getChanges(mode: "full"|"summary"|"minimal") {
        return this.fileChanges.filter(x => mode === "full" ? true : x.hasChanges())
            .map(x => `${color.bgBlue(` === ${x.fileName} === `)}\n${x.colorText(mode)}`).join("\n\n");
    }
}

export class PackageStateCapture {
    overviews: { [name: string]: string } = {};

    constructor(public pkg: Package) { 
        for (const file of Object.values(pkg.files))
            this.overviews[file.sourcePath.path] = TSOverviewGenerator.generate(file);
    }

    diff(baseLine: PackageStateCapture) {
        const result: FileStateChanges[] = [];
        for (const file of Object.keys(this.overviews)) {
            const diff = cleverDiff(baseLine.overviews[file], this.overviews[file]);
            result.push(new FileStateChanges(this.pkg.name, file, diff));
        }
        return new WorkspaceStateChanges(result);
    }
}

enum ChangeType { Added = "Added", Removed = "Removed", SameText = "SameText", SameBlock = "SameBlock" }

class Change {
    constructor(public type: ChangeType, public value: string) { }
}

function cleverDiff(str1: string, str2: string) {
    const result: Change[] = [];

    const jsChanges = jsdiff.diffChars(str1, str2);
    for (let i = 0; i < jsChanges.length; i++) {
        const jsCh = jsChanges[i];
        const value = jsCh.value;
        const firstChange = i === 0;
        const lastChange = i === jsChanges.length - 1;
        if (jsCh.added) {
            result.push(new Change(ChangeType.Added, value));
        } else if (jsCh.removed) {
            result.push(new Change(ChangeType.Removed, value));
        } else if (firstChange && lastChange) {
            result.push(new Change(ChangeType.SameBlock, value));
        } else if (firstChange) {
            const lastNl = value.lastIndexOf("\n");
            if (lastNl === -1) {
                result.push(new Change(ChangeType.SameText, value));
            } else {
                result.push(new Change(ChangeType.SameBlock, value.substring(0, lastNl + 1)));
                result.push(new Change(ChangeType.SameText, value.substr(lastNl + 1)));
            }
        } else if (lastChange) {
            const firstNl = value.indexOf("\n");
            if (firstNl === -1) {
                result.push(new Change(ChangeType.SameText, value));
            } else {
                result.push(new Change(ChangeType.SameText, value.substr(0, firstNl + 1)));
                result.push(new Change(ChangeType.SameBlock, value.substring(firstNl + 1)));
            }
        } else {
            const firstNl = value.indexOf("\n");
            if (firstNl === -1) {
                result.push(new Change(ChangeType.SameText, value));
            } else {
                result.push(new Change(ChangeType.SameText, value.substr(0, firstNl + 1)));
                const lastNl = value.lastIndexOf("\n");
                if (lastNl !== firstNl)
                    result.push(new Change(ChangeType.SameBlock, value.substring(firstNl + 1, lastNl + 1)));
                result.push(new Change(ChangeType.SameText, value.substr(lastNl + 1)));
            }
        }
    }

    return result;
}