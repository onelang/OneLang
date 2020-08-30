// @python-import-all OneFile
import { OneFile } from "One.File-v0.1";
import { PackageSource, PackageId, PackageBundle, PackageContent, PackageType } from "./PackageManager";

export class PackagesFolderSource implements PackageSource {
    constructor(public packagesDir: string = "packages") { }

    getPackageBundle(ids: PackageId[], cachedOnly: boolean): Promise<PackageBundle> {
        throw new Error("Method not implemented.");
    }

    async getAllCached(): Promise<PackageBundle> {
        const packages: { [id: string]: PackageContent } = {};
        const allFiles: string[] = OneFile.listFiles(this.packagesDir, true);
        for (let fn of allFiles) {
            if (fn === "bundle.json") continue; // TODO: hack
            const pathParts = fn.split(/\//g); // [0]=implementations/interfaces, [1]=package-name, [2:]=path
            const type = pathParts.shift();
            const pkgDir = pathParts.shift();
            if (type !== "implementations" && type !== "interfaces") continue; // skip e.g. bundle.json
            const pkgIdStr = `${type}/${pkgDir}`;
            let pkg = packages[pkgIdStr];
            if (!pkg) {
                const pkgDirParts: string[] = pkgDir.split(/-/g);
                const version = pkgDirParts.pop().replace(/^v/, "");
                const pkgType = type === "implementations" ? PackageType.Implementation : PackageType.Interface;
                const pkgId = new PackageId(pkgType, pkgDirParts.join("-"), version);
                pkg = new PackageContent(pkgId, {}, true);
                packages[pkgIdStr] = pkg;
            }
            pkg.files[pathParts.join("/")] = OneFile.readText(`${this.packagesDir}/${fn}`);
        }
        return new PackageBundle(Object.values(packages));
    }
}
