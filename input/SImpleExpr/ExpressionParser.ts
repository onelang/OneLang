import { Tokenizer } from "./Tokenizer";
import { AstNode, OperatorData, OperatorType, Token, TokenType, Parser } from "./Parser";

const operators = [
    new OperatorData("<<", 5),
    new OperatorData(">>", 5),
    new OperatorData("++"),
    new OperatorData("--"),
    new OperatorData("==", -3),
    new OperatorData("<"),
    new OperatorData(">"),
    new OperatorData("=", -4, OperatorType.Normal, true),
    new OperatorData("(", 4, OperatorType.LeftParenthesis),
    new OperatorData(")", 0, OperatorType.RightParenthesis),
    new OperatorData("["),
    new OperatorData("]"),
    new OperatorData("{", 0, OperatorType.LeftParenthesis),
    new OperatorData("}", 0, OperatorType.RightParenthesis),
    new OperatorData(";", -5),
    new OperatorData("+", 1),
    new OperatorData("-", 1),
    new OperatorData("*", 2),
    new OperatorData("/", 2),
    new OperatorData("&", 4),
    new OperatorData("%", 3),
    new OperatorData("||", 0),
    new OperatorData("|", 3),
    new OperatorData("^", 0, OperatorType.Normal, true),
    new OperatorData(",", 0, OperatorType.ArgumentSeparator),
    new OperatorData(".", 10),
];
const operatorDict = operators.toDict(x => x.text);

export class ExpressionParser {
    static exprToAst(code: string): AstNode
    {
        var parsedTokens = Tokenizer.tokenize(code, operators.map(x => x.text));

        var tokens = [];
        for (let ptoken of parsedTokens)
        {
            if (ptoken.value == "[")
            {
                tokens.push(new Token(TokenType.Operator, new OperatorData(".")));
                tokens.push(new Token(TokenType.Identifier, null, "index"));
                tokens.push(new Token(TokenType.Operator, new OperatorData(null, null, OperatorType.LeftParenthesis)));
            }
            else if (ptoken.value == "]")
            {
                tokens.push(new Token(TokenType.Operator, new OperatorData(null, null, OperatorType.RightParenthesis)));
            }
            else
            {
                var token: Token;
                    
                if(ptoken.isOperator)
                    token = new Token(TokenType.Operator, operatorDict[ptoken.value]);
                else
                    token = new Token(TokenType.Identifier, null, ptoken.value);
                    
                tokens.push(token);
            }
        }

        //console.log("tokens:\n" + tokens.map(x => " - " + x.repr()).join("\n"));

        var ast = new Parser(tokens).parse();
        return ast;
    }


    static parse(expr: string): AstNode {
        const ast = this.exprToAst(expr);
        //console.log("ast", ast);
        return ast;
    }
}