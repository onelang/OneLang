import 'module-alias/register';

process.env.NODE_PATH = `${__dirname}/../../onepkg`;
require("module").Module._initPaths();

import { SelfTestRunner } from "@one/Test/SelfTestRunner";
import { CsharpGenerator } from '@one/Generator/CsharpGenerator';

new SelfTestRunner(`${__dirname}/../../`).runTest(new CsharpGenerator());