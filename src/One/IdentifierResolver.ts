// import { AstVisitor } from "./AstVisitor";
// import { OneAst as one } from "./Ast";
// import { VariableContext } from "./VariableContext";

// type Context = VariableContext<one.Expression>;

// export class IdentifierResolver extends AstVisitor<Context> {
//     constructor(public schema: one.Schema) { super(); }

//     addLocalVar(context: Context, variable: one.VariableBase) {
//         context.add(variable.name, new one.LocalMethodVariable(variable.name));
//     }

//     static replaceProperties(dest, src)  {
//         for (var i in dest) 
//             delete dest[i];
//         for (var i in src) 
//             dest[i] = src[i];
//     }

//     protected visitIdentifier(id: one.Identifier, context: Context) {
//         const idValue = context.get(id.text);
//         this.log(`Processing ID: ${id.text}: ${idValue && idValue.exprKind || "???"}`);
//         if (idValue)
//             IdentifierResolver.replaceProperties(id, idValue);
//     }
    
//     protected visitVariableDeclaration(stmt: one.VariableDeclaration, context: Context) {
//         super.visitVariableDeclaration(stmt, context);
//         this.addLocalVar(context, stmt);
//     }

//     protected visitForStatement(stmt: one.ForStatement, context: Context) {
//         this.visitExpression(stmt.itemVariable.initializer, context);
        
//         const newContext = context.inherit();
//         this.addLocalVar(newContext, stmt.itemVariable);

//         this.visitExpression(stmt.condition, newContext);
//         this.visitExpression(stmt.incrementor, newContext);
//         this.visitBlock(stmt.body, newContext);
//     }

//     protected visitForeachStatement(stmt: one.ForeachStatement, context: Context) {
//         this.visitExpression(stmt.items, context);
        
//         const newContext = context.inherit();
//         this.addLocalVar(newContext, stmt.itemVariable);

//         this.visitBlock(stmt.body, newContext);
//     }

//     protected visitPropertyAccessExpression(expr: one.PropertyAccessExpression, context: Context) {
//         super.visitPropertyAccessExpression(expr, context);
//     }

//     process() {
//         const globalContext = new VariableContext<one.Expression>();

//         for (const cls of Object.values(this.schema.classes)) {
//             const classContext = globalContext.inherit();
//             //classContext.add("this", one.Type.Class(cls.name));
//             for (const method of Object.values(cls.methods))
//                 classContext.add(method.name, new one.LocalMethodReference(method.name));

//             for (const method of Object.values(cls.methods)) {
//                 const methodContext = classContext.inherit();
//                 for (const param of method.parameters)
//                     this.addLocalVar(methodContext, param);

//                 this.visitBlock(method.body, methodContext);
//             }
//         }
//     }
// }
