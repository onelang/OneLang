// export abstract class Reference implements Expression {
//     parentRef?: Expression | Statement;
//     valueType?: Type;
// }

// export enum VariableRefType { 
//     StaticField = "StaticField",
//     InstanceField = "InstanceField",
//     MethodArgument = "MethodArgument",
//     LocalVar = "LocalVar",
// }

// expo

// export class VariableRef extends Reference {
//     static InstanceField(thisExpr: Expression, varRef: VariableBase) {
//         return new VariableRef(VariableRefType.InstanceField, varRef, thisExpr);
//     }

//     static StaticField(thisExpr: Expression, varRef: VariableBase) {
//         return new VariableRef(VariableRefType.StaticField, varRef, thisExpr);
//     }

//     static MethodVariable(varRef: VariableBase) {
//         return new VariableRef(VariableRefType.LocalVar, varRef);
//     }

//     static MethodArgument(varRef: VariableBase) {
//         return new VariableRef(VariableRefType.MethodArgument, varRef);
//     }

//     static Load(source: any) {
//         return Object.assign(new VariableRef(null, null), source);
//     }

//     protected constructor(public varType: VariableRefType, public varRef: VariableBase, public thisExpr?: Expression) { super(); }
// }

// export class MethodReference extends Reference {
//     exprKind = ExpressionKind.MethodReference;

//     constructor(public methodRef: Method, public thisExpr?: Expression) { super(); }
// }

// export class ClassReference extends Reference {
//     exprKind = ExpressionKind.ClassReference;
    
//     constructor(public classRef: Class) { super(); }
// }

// export class EnumReference extends Reference {
//     exprKind = ExpressionKind.EnumReference;
    
//     constructor(public enumRef: Enum) { super(); }
// }

// export class EnumMemberReference extends Reference {
//     exprKind = ExpressionKind.EnumMemberReference;
    
//     constructor(public enumMemberRef: EnumMember, public enumRef: Enum) { super(); }
// }

// export class ThisReference extends Reference {
//     exprKind = ExpressionKind.ThisReference;
// }
