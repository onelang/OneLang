import 'module-alias/register';
import 'process';

process.env.NODE_PATH = `${__dirname}/../../onepkg`;
require("module").Module._initPaths();

import { SelfTestRunner } from "@one/Test/SelfTestRunner";
import { CsharpGenerator } from '@one/Generator/CsharpGenerator';

new SelfTestRunner(`${__dirname}/../../`).runTest(new CsharpGenerator()).then(res => process.exit(res ? 0 : 1));