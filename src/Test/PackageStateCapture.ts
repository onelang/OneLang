import { Package } from "../One/Ast/Types";
import { TSOverviewGenerator } from "../Utils/TSOverviewGenerator";

export class PackageStateCapture {
    overviews: { [name: string]: string; } = {};

    constructor(public pkg: Package) {
        for (const file of Object.values(pkg.files))
            this.overviews[file.sourcePath.path] = new TSOverviewGenerator(false, true).generate(file);
    }

    getSummary() {
        return Object.keys(this.overviews).map(file => `=== ${file} ===\n\n${this.overviews[file]}`).join('\n\n');
    }
}
