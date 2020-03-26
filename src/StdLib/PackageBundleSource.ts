import { PackageSource, PackageId, PackageBundle } from "./PackageManager";

export class PackageBundleSource implements PackageSource {
    constructor(public bundle: PackageBundle) { }

    getPackageBundle(ids: PackageId[], cachedOnly: boolean): Promise<PackageBundle> {
        throw new Error("Method not implemented.");
    }

    async getAllCached(): Promise<PackageBundle> {
        return await Promise.resolve(this.bundle);
    }
}
