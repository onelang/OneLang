import { glob, readFile } from '../TestUtils';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";

function testFolder(folder: string) {
    const files = glob(folder).filter(x => x.endsWith(".ts"));
    for (const file of files)
        it(file, () => TypeScriptParser2.parseFile(readFile(file)));
}

describe("Native resolvers", () => testFolder("langs/NativeResolvers"));
describe("Package interfaces", () => testFolder("packages/interfaces"));
describe("Test inputs", () => testFolder("test/testSuites/CompilationTest"));