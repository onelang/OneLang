import { baseDir } from './Utils/TestUtils';
import { TestRunner } from "@one/Test/TestRunner";

new TestRunner(baseDir, process.argv).runTests();