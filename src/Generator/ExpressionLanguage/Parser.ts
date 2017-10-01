export enum OperatorType {
    Normal = "Normal",
    LeftParenthesis = "LeftParenthesis",
    RightParenthesis = "RightParenthesis",
    ArgumentSeparator = "ArgumentSeparator",
    NoOp = "NoOp"
}

export class OperatorData {
    constructor(public text?: string, public precedence: number = 0, public type: OperatorType = OperatorType.Normal,
        public isRightAssociative: boolean = false) { }
    repr() { return this.text; }
    static NoOp = new OperatorData(null, 0, OperatorType.NoOp);
}

export enum TokenType { Identifier = "Identifier", Operator = "Operator" }

export class Token {
    constructor(public type: TokenType, public operator: OperatorData, public identifier: string = null) { }
    repr() { return this.type === TokenType.Identifier ? this.identifier : this.operator.text; }
}

export class OperatorWithOperand {
    constructor(public operator: OperatorData, public operand: AstNode) { }
    repr() { return `${this.operator ? this.operator.text : ""}${this.operand.repr()}`; }
}

export enum AstNodeType { Identifier = "Identifier", OperatorList = "OperatorList", Function = "Function" }

export class AstNode {
    operands: OperatorWithOperand[];
    identifier: string;
    function: AstNode;
    arguments: AstNode[];

    constructor(public type: AstNodeType) { }

    repr(): string {
        return this.type === AstNodeType.Identifier ? this.identifier :
            this.type === AstNodeType.OperatorList ? `(${this.operands.map(x => x.repr()).join(", ")})` :
            this.type === AstNodeType.Function ? `{${this.function.repr()}}(${this.arguments.map(x => x.repr()).join(", ")})` :
                "<unknown AstNode type>";
    }
}

enum OpStackItemType { Operator = "Operator", LeftParenthesis = "LeftParenthesis", Function = "Function" }

class OpStackItem {
    constructor(public type: OpStackItemType, public operator: OperatorData) { }

    repr() {
        return this.type === OpStackItemType.Function ? "<func>" :
            this.type === OpStackItemType.LeftParenthesis ? "<" : this.operator.repr();
    }
}

export class Parser {
    nodeStack: AstNode[] = [];
    opStack: OpStackItem[] = [];
    token: Token = null;

    constructor(public tokens: Token[]) { }

    addNode(nodeOp: OpStackItem) {
        var item = this.nodeStack.pop();
        var parent = this.nodeStack.pop();

        if (!parent) {
            const newNode = new AstNode(AstNodeType.OperatorList);
            newNode.operands = [new OperatorWithOperand(null, item), new OperatorWithOperand(nodeOp.operator, null)];
            this.nodeStack.push(newNode);
        } else {
            if (parent.type !== AstNodeType.OperatorList || 
                    (parent.operands[1] && nodeOp.operator.precedence !== parent.operands[1].operator.precedence)) {
                const oldParent = parent;
                parent = new AstNode(AstNodeType.OperatorList);
                parent.operands = [new OperatorWithOperand(null, oldParent)];
            }

            parent.operands.push(new OperatorWithOperand(nodeOp.operator, item));
            this.nodeStack.push(parent);
        }
    }

    nextOp(type: OpStackItemType) {
        var op1 = this.token.operator;

        while (this.opStack.length > 0) {
            var stackTop = this.opStack.last();
            if (stackTop.type !== OpStackItemType.Operator || stackTop.operator.type !== OperatorType.Normal) break;

            var op2 = stackTop.operator;
            if ((!op1.isRightAssociative && op1.precedence <= op2.precedence) ||
                    op1.isRightAssociative && op1.precedence < op2.precedence)
                this.addNode(this.opStack.pop());
            else
                break;
        }

        this.opStack.push(new OpStackItem(type, op1));
    }

    parse(): AstNode {
        for (let iToken = 0; iToken < this.tokens.length; iToken++) {
            this.token = this.tokens[iToken];
            if (this.token.type === TokenType.Identifier) {
                const node = new AstNode(AstNodeType.Identifier);
                node.identifier = this.token.identifier;
                this.nodeStack.push(node);
            } else if (this.token.operator.type === OperatorType.LeftParenthesis) {
                var isFunc = iToken > 0 && (this.tokens[iToken - 1].type === TokenType.Identifier ||
                                            this.tokens[iToken - 1].operator.type === OperatorType.RightParenthesis);

                this.nextOp(isFunc ? OpStackItemType.Function : OpStackItemType.LeftParenthesis);

                if (isFunc) {
                    const node = new AstNode(AstNodeType.Function);
                    node.function = this.nodeStack.pop();
                    node.arguments = [];
                    this.nodeStack.push(node);
                }
            } else if (this.token.operator.type === OperatorType.RightParenthesis || this.token.operator.type === OperatorType.ArgumentSeparator) {
                // parse current expression into one node
                let lastOp: OpStackItem;
                while (true) {
                    if (this.opStack.length <= 0)
                        throw new Error("Unbalanced right parentheses");

                    lastOp = this.opStack.pop();
                    if (lastOp.type !== OpStackItemType.Operator)
                        break;

                    this.addNode(lastOp);
                }

                // function => push argument into argument list
                if (lastOp.type === OpStackItemType.Function) {
                    var noArgs = iToken > 0 && this.tokens[iToken - 1].type === TokenType.Operator &&
                        this.tokens[iToken - 1].operator.type === OperatorType.LeftParenthesis;

                    if (!noArgs) {
                        var arg = this.nodeStack.pop();
                        //if (arg.Type == AstNodeType.Function)
                        //    nodeStack.Push(arg);
                        //else
                        this.nodeStack.last().arguments.push(arg);
                    }
                }

                // if this was only a separator then push the starting operator to the start
                if (this.token.operator.type === OperatorType.ArgumentSeparator)
                    this.opStack.push(lastOp);
            } else {
                this.nextOp(OpStackItemType.Operator);
            }

            //console.log(`${this.token} | ${this.opStack.join(", ")} | ${this.nodeStack.join(", ")}`);
        }

        while (this.opStack.length > 0)
            this.addNode(this.opStack.pop());

        var result = this.nodeStack.pop();
        return result;
    }
}