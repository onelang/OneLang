import { PackageSource, PackageId, PackageBundle, PackageContent } from "./PackageManager";
import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";

export class PackagesFolderSource implements PackageSource {
    getPackageBundle(ids: PackageId[], cachedOnly: boolean): Promise<PackageBundle> {
        throw new Error("Method not implemented.");
    }
    async getAllCached(): Promise<PackageBundle> {
        const packages: {
            [id: string]: PackageContent;
        } = {};
        const baseDir = `${__dirname}/../../packages/`;
        const allFiles = glob.sync(`${baseDir}**/*`, { nodir: true });
        for (const fn of allFiles) {
            const [type, pkgDir, ...pathParts] = path.relative(baseDir, fn).split("/"); // [0]=packages, [1]=implementations/interfaces, [2]=package-name, [3:]=path
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
