import { PackageSource, PackageId, PackageBundle, PackageContent, PackageType } from "./PackageManager";

export class PackagesFolderSource implements PackageSource {
    constructor(public packagesDir: string = "packages") { }

    getPackageBundle(ids: PackageId[], cachedOnly: boolean): Promise<PackageBundle> {
        throw new Error("Method not implemented.");
    }

    async getAllCached(): Promise<PackageBundle> {
        const fs = await import("fs");
        const glob = await import("glob");
        const path = await import("path");

        const packages: { [id: string]: PackageContent } = {};
        const allFiles: string[] = glob.sync(`${this.packagesDir}/**/*`, { nodir: true });
        for (const fn of allFiles) {
            const pathParts = path.relative(this.packagesDir, fn).split(/\//g); // [0]=implementations/interfaces, [1]=package-name, [2:]=path
            const type = pathParts.shift();
            const pkgDir = pathParts.shift();
            if (type !== "implementations" && type !== "interfaces") continue; // skip e.g. bundle.json
            let pkg = packages[`${type}/${pkgDir}`];
            if (!pkg) {
                const pkgDirParts: string[] = pkgDir.split(/-/g);
                const version = pkgDirParts.pop().replace(/^v/, "");
                const pkgType = type === "implementations" ? PackageType.Implementation : PackageType.Interface;
                const pkgId = new PackageId(pkgType, pkgDirParts.join("-"), version);
                pkg = packages[`${type}/${pkgDir}`] = new PackageContent(pkgId, {}, true);
            }
            pkg.files[pathParts.join("/")] = fs.readFileSync(fn, "utf-8");
        }
        return Promise.resolve(new PackageBundle(Object.values(packages)));
    }
}
