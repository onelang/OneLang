import { PackageSource, PackageId, PackageBundle, PackageContent } from "./PackageManager";

export class PackagesFolderSource implements PackageSource {
    constructor(public packagesDir = "packages") { }

    getPackageBundle(ids: PackageId[], cachedOnly: boolean): Promise<PackageBundle> {
        throw new Error("Method not implemented.");
    }

    async getAllCached(): Promise<PackageBundle> {
        const fs = await import("fs");
        const glob = await import("glob");
        const path = await import("path");

        const packages: {
            [id: string]: PackageContent;
        } = {};
        
        const allFiles = glob.sync(`${this.packagesDir}/**/*`, { nodir: true });
        for (const fn of allFiles) {
            const [type, pkgDir, ...pathParts] = path.relative(this.packagesDir, fn).split("/"); // [0]=implementations/interfaces, [1]=package-name, [2:]=path
            if (type !== "implementations" && type !== "interfaces") continue; // skip e.g. bundle.json
            let pkg = packages[`${type}/${pkgDir}`];
            if (!pkg) {
                const pkgDirParts: string[] = pkgDir.split("-");
                const version = pkgDirParts.pop().replace(/^v/, "");
                pkg = packages[`${type}/${pkgDir}`] = <PackageContent>{
                    id: <PackageId>{
                        name: pkgDirParts.join("-"),
                        type: type === "implementations" ? "Implementation" : "Interface",
                        version
                    },
                    fromCache: true,
                    files: {}
                };
            }
            pkg.files[pathParts.join("/")] = fs.readFileSync(fn, "utf-8");
        }
        return <PackageBundle>{ packages: Object.values(packages) };
    }
}
