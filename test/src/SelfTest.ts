import 'module-alias/register';
import 'process';

process.env.NODE_PATH = `${__dirname}/../../onepkg`;
require("module").Module._initPaths();

import { TestRunner } from "@one/Test/TestRunner";

new TestRunner(`${__dirname}/../../`, process.argv).runTests();