import 'module-alias/register';
import 'process';

process.env.NODE_PATH = `${__dirname}/../../onepkg`;
require("module").Module._initPaths();

import { SelfTestRunner } from "@one/Test/SelfTestRunner";

new SelfTestRunner(`${__dirname}/../../`).runTest().then(res => process.exit(res ? 0 : 1));