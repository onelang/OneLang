import * as ts from "typescript";
import fs = require("fs");
import { KSLangSchema } from "./KSLangSchema";

//const code = fs.readFileSync("input/Tokenizer.ts", "utf8");

function logNodeError(message: string, node?: Node) {
    console.warn(message, node);
}

function nameToKS(name: string, node?: Node) {
    let result = "";
    for (let c of name) {
        if ("A" <= c && c <= "Z")
            result += (result === "" ? "" : "_") + c.toLowerCase();
        else if("a" <= c && c <= "z" || c === "_")
            result += c;
        else
            logNodeError(`Invalid character ('${c}') in name: ${name}.`, node);
    }
    return result;
}

// function getType(node: ts.Node): ts.Type {
//     var ts2 = ts;
//     const typeChecker = program.getTypeChecker();
//     const symbol = typeChecker.getSymbolAtLocation(node);
//     const type = typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
//     //const typeStr = typeChecker.typeToString(type);
//     return type;
// }

// function convertType(tsType: ts.TypeNode): KSLangSchema.Type {
//     const ksType = <KSLangSchema.Type> {};
//     if (tsType.kind === ts.SyntaxKind.ArrayType) {
//         const tsArrayType = <ts.ArrayTypeNode> tsType;
//         ksType.type = KSLangSchema.PrimitiveType.Array;
//         ksType.typeArguments = [convertType(tsArrayType.elementType)];
//         return ksType;
//     } else if(tsType.kind === ts.SyntaxKind.TypeReference) {
//         const tsTypeRef = <ts.TypeReferenceNode> tsType;
//         ksType.type = KSLangSchema.PrimitiveType.Class;
//         ksType.className = tsTypeRef.typeName.getText();
//         return ksType;
//     } else
//         logNodeError(`Unexpected type kind "${ts.SyntaxKind[tsType.kind]}". Only Constructor, Property and Method are supported.`);
// }

// function createSchemaFromTSFile(sourceFile: ts.SourceFile): KSLangSchema.SchemaFile {
//     const schema = <KSLangSchema.SchemaFile> { enums: {}, classes: {} };

//     for (let statement of sourceFile.statements) {
//         if (statement.kind === ts.SyntaxKind.ClassDeclaration) {
//             const classDecl = <ts.ClassDeclaration> statement;
//             const className = nameToKS(classDecl.name.getText());
//             const classSchema = schema.classes[className] = <KSLangSchema.Class> { name: className, fields: {}, methods: {} };
//             for (let member of classDecl.members) {

//                 if (member.kind === ts.SyntaxKind.PropertyDeclaration) {
//                     const propDecl = <ts.PropertyDeclaration> member;
//                     const propName = nameToKS(member.name.getText());
//                     const fieldSchema = classSchema.fields[propName] = <KSLangSchema.Field>{ name: propName };
//                     fieldSchema.defaultValue = propDecl.initializer && propDecl.initializer.getText();
//                     getType(propDecl);
//                     const propType = convertType(propDecl.type);
//                     fieldSchema.type = propType;
//                 } else if (member.kind === ts.SyntaxKind.Constructor) {
//                 } else if (member.kind === ts.SyntaxKind.MethodDeclaration) {
//                 } else
//                     logNodeError(`Unexpected node kind "${ts.SyntaxKind[member.kind]}". Only Constructor, Property and Method are supported.`);
//             }
//         } else if (statement.kind === ts.SyntaxKind.EnumDeclaration) {
//             const enumDecl = <ts.EnumDeclaration> statement;
//             const enumName = nameToKS(enumDecl.name.getText());
//             const enumSchema = schema.enums[enumName] = <KSLangSchema.Enum> { name: enumName, values: {} };
//             for (let member of enumDecl.members) {
//                 const enumMemberName = nameToKS(member.name.getText());
//                 const enumMember = enumSchema.values[enumMemberName] = <KSLangSchema.EnumMember> { name: enumMemberName };
//             }
//         } else
//             logNodeError(`Unexpected node kind "${ts.SyntaxKind[statement.kind]}". Only Class and Enum are supported.`);
//     }

//     return schema;
// }

// function exportSchema(schema: KSLangSchema.SchemaFile) {
//     schema = Object.assign({}, schema);
//     if (Object.keys(schema.classes).length === 0)
//         delete schema.classes;
//     else {
//         for (let className of Object.keys(schema.classes)) {
//             const _class = Object.assign({}, schema.classes[className]);
//             if (_class.name)
//                 delete _class.name;
//         }
//     }
//     //if (Object.keys(schema.enums).length === 0) delete schema.enums;
// }

import * as TsTypeInfo from "ts-type-info";

function convertTsType(tsType: TsTypeInfo.TypeDefinition) {
    const result = <KSLangSchema.Type> { };

    if (tsType.text === "number")
        result.type = KSLangSchema.PrimitiveType.Int32;
    else if (tsType.text === "string")
        result.type = KSLangSchema.PrimitiveType.String;
    else if (tsType.isArrayType)
        result.type = KSLangSchema.PrimitiveType.Array;
    else {
        result.type = KSLangSchema.PrimitiveType.Class;
        result.className = tsType.definitions[0].name;
    }

    if (tsType.typeArguments.length > 0)
        result.typeArguments = tsType.typeArguments.map(x => convertTsType(x));

    return result;
}

function createSchemaFromTSTypeInfo(typeInfo: TsTypeInfo.FileDefinition): KSLangSchema.SchemaFile {
    const schema = <KSLangSchema.SchemaFile> { enums: {}, classes: {} };
    for (const tsEnum of typeInfo.enums) {
        schema.enums[tsEnum.name] = <KSLangSchema.Enum> { 
            name: tsEnum.name,
            values: tsEnum.members.map(tsEnumMember => ({ name: tsEnumMember.name }))
        };
    }
    for (const tsClass of typeInfo.classes) {
        const classSchema = schema.classes[tsClass.name] = <KSLangSchema.Class> { fields: { } };
        for (const tsProp of tsClass.properties) {
            const fieldSchema = classSchema.fields[tsProp.name] = <KSLangSchema.Field> { 
                type: convertTsType(tsProp.type),
                visibility: tsProp.scope === "public" ? KSLangSchema.Visibility.Public : 
                    tsProp.scope === "protected" ? KSLangSchema.Visibility.Protected : 
                    KSLangSchema.Visibility.Private,
            };
            if (tsProp.defaultExpression) {
                fieldSchema.defaultValue = tsProp.defaultExpression.text;
            }
        }
    }
    return schema;
}

// const sourceFile = program.getSourceFile(filename);
// const diagnostics = program.getSemanticDiagnostics(sourceFile);
// const schema = createSchemaFromTSFile(sourceFile);
const tsTypeInfo = TsTypeInfo.getInfoFromFiles(["input/Test.ts"]);

const schema = createSchemaFromTSTypeInfo(tsTypeInfo.files[0]);
const schemaJson = JSON.stringify(schema, function (k,v) {
    if (["enums", "classes", "items", "methods", "fields"].indexOf(k) !== -1 && Object.keys(v).length === 0) return undefined;
    return v;
}, 4);
console.log(schemaJson);

debugger;

