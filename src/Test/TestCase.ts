export class TestCase {
    constructor(public name: string, public action: (artifactDir: string) => Promise<void>) { }
}

export class SyncTestCase extends TestCase {
    constructor(name: string, public syncAction: (artifactDir: string) => void) {
        super(name, null);
        this.action = (artifactDir: string) => this.execute(artifactDir);
    }

    async execute(artifactDir: string): Promise<void> {
        this.syncAction(artifactDir);
    }
}

export interface ITestCollection {
    name: string;
    getTestCases(): TestCase[];
}
