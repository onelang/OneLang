import { PackageSource, PackageId, PackageBundle } from "./PackageManager";

export class PackageBundleSource implements PackageSource {
    constructor(public bundle: PackageBundle) { }

    getPackageBundle(ids: PackageId[], cachedOnly: boolean): Promise<PackageBundle> {
        throw new Error("Method not implemented.");
        return null;
    }

    async getAllCached(): Promise<PackageBundle> {
        return Promise.resolve(this.bundle);
    }
}
