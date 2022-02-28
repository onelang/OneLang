import { readFile, writeFile, baseDir } from './Utils/TestUtils';
import { TypeScriptParser2 } from '@one/Parsers/TypeScriptParser';
import { LineParser, NodeVisualizer, TreeBuilder } from './TemplateGenerator/BlockParser';
import { TmplTreeConverter } from './TemplateGenerator/ModelParser';

const tmplStr = readFile("src/Generator/Csharp.tmpl");
const treeBuilder = new TreeBuilder();
const root = LineParser.parse(tmplStr, treeBuilder);
console.log(root);
console.log(NodeVisualizer.stringifyTree(root, '_', '.'));
const treeStr = NodeVisualizer.stringifyTree(root).replace(/\n +(?=\n)/g, "\n");
if (treeStr !== tmplStr) {
    writeFile("src/Generator/Csharp.tmpl.gen", treeStr);
    debugger;
}
const tmplTree = new TmplTreeConverter(tmplStr).convertRootNode(root);
const sourceFileTmpl = tmplTree.typeTemplates.find(x => x.typeName == "SourceFile");
if (!sourceFileTmpl)
    throw new Error("No SourceFile template!");

const sourceFile = new TypeScriptParser2(`
class TestClass {
    testMethod() {
        return 1 + 2;
    }
}
`).parse();

debugger;