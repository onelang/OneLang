using System.Collections.Generic;
using System;

public class TokenType
{
    public static string EndToken = "EndToken";
    public static string Whitespace = "Whitespace";
    public static string Identifier = "Identifier";
    public static string OperatorX = "Operator";
}

public class Token
{
    public string Value;
    public bool IsOperator;

    public Token(string value, bool isOperator)
    {
        this.Value = value;
        this.IsOperator = isOperator;
    }
}

public class StringHelper
{
    public static bool StartsWithAtIndex(string str, string substr, int idx)
    {
        return str.Substring(idx, idx + substr.Length - idx) == substr;
    }
}

public class Tokenizer
{
    public int Offset;
    public string Text;
    public List<string> Operators;

    public Tokenizer(string text, List<string> operators)
    {
        this.Text = text;
        this.Operators = operators;
        this.Offset = 0;
    }

    public string GetTokenType()
    {
        if (this.Offset >= this.Text.Length)
        {
            return TokenType.EndToken;
        }
        
        var c = this.Text[this.Offset];
        return c == ' ' || c == '\n' || c == '\t' || c == '\r' ? TokenType.Whitespace : ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || ('0' <= c && c <= '9') || c == '_' ? TokenType.Identifier : TokenType.OperatorX;
    }
    
    public List<Token> Tokenize()
    {
        var result = new List<Token> {  };
        
        while (this.Offset < this.Text.Length)
        {
            var charType = this.GetTokenType();
            
            if (charType == TokenType.Whitespace)
            {
                while (this.GetTokenType() == TokenType.Whitespace)
                {
                    this.Offset++;
                }
            }
            else if (charType == TokenType.Identifier)
            {
                var startOffset = this.Offset;
                while (this.GetTokenType() == TokenType.Identifier)
                {
                    this.Offset++;
                }
                var identifier = this.Text.Substring(startOffset, this.Offset - startOffset);
                result.Add(new Token(identifier, false));
            }
            else
            {
                var op = "";
                foreach (var currOp in this.Operators)
                {
                    if (StringHelper.StartsWithAtIndex(this.Text, currOp, this.Offset))
                    {
                        op = currOp;
                        break;
                    }
                }
                
                if (op == "")
                {
                    break;
                }
                
                this.Offset += op.Length;
                result.Add(new Token(op, true));
            }
        }
        
        return result;
    }
}

public class TestClass
{
    public void TestMethod()
    {
        var operators = new List<string> { "<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", "." };
        
        var input = "hello * 5";
        var tokenizer = new Tokenizer(input, operators);
        var result = tokenizer.Tokenize();
        
        Console.WriteLine("token count:");
        Console.WriteLine(result.Count);
        foreach (var item in result)
        {
            Console.WriteLine(item.Value + "(" + (item.IsOperator ? "op" : "id") + ")");
        }
    }
}

public class Program
{
    static public void Main()
    {
        try 
        {
            new TestClass().TestMethod();
        }
        catch (System.Exception e)
        {
            System.Console.WriteLine($"Exception: {e.Message}");
        }
    }
}