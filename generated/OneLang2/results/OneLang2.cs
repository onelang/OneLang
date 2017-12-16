using System;
using System.Collections.Generic;

public class TokenKind
{
    public static string Number = "number";
    public static string Identifier = "identifier";
    public static string OperatorX = "operator";
    public static string StringX = "string";
}

public class Token
{
    public string Kind;
    public string Value;

    public Token(string kind, string value)
    {
        this.Value = value;
        this.Kind = kind;
    }
}

public class ExprLangLexer
{
    public int Offset = 0;
    public List<Token> Tokens = new List<Token> {  };
    public string Expression;
    public List<string> Operators;

    public ExprLangLexer(string expression, List<string> operators)
    {
        this.Operators = operators;
        this.Expression = expression;
        if (!this.TryToReadNumber())
        {
            this.TryToReadOperator();
            this.TryToReadLiteral();
        }
        
        while (this.HasMoreToken())
        {
            if (!this.TryToReadOperator())
            {
                this.Fail("expected operator here");
            }
            
            this.TryToReadLiteral();
        }
    }

    public void Fail(string message)
    {
        var context = this.Expression.Substring(this.Offset, this.Offset + 30 - this.Offset) + "...";
        throw new Exception($"TokenizerException: {message} at '{context}' (offset: {this.Offset})");
    }
    
    public bool HasMoreToken()
    {
        this.SkipWhitespace();
        return !this.Eof();
    }
    
    public void Add(string kind, string value)
    {
        this.Tokens.Add(new Token(kind, value));
        this.Offset += value.Length;
    }
    
    public string TryToMatch(string pattern)
    {
        var matches = OneRegex.MatchFromIndex(pattern, this.Expression, this.Offset);
        return matches[0];
    }
    
    public bool TryToReadOperator()
    {
        this.SkipWhitespace();
        foreach (var op in this.Operators)
        {
            if (String.Compare(this.Expression, this.Offset, op, 0, (op).Length) == 0)
            {
                this.Add(TokenKind.OperatorX, op);
                return true;
            }
        }
        return false;
    }
    
    public bool TryToReadNumber()
    {
        this.SkipWhitespace();
        var number = this.TryToMatch("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)");
        if (number == "")
        {
            return false;
        }
        
        this.Add(TokenKind.Number, number);
        if (this.TryToMatch("[0-9a-zA-Z]"))
        {
            this.Fail("invalid character in number");
        }
        
        return true;
    }
    
    public bool TryToReadIdentifier()
    {
        this.SkipWhitespace();
        var identifier = this.TryToMatch("[a-zA-Z_][a-zA-Z0-9_]*");
        if (identifier == "")
        {
            return false;
        }
        
        this.Add(TokenKind.Identifier, identifier);
        return true;
    }
    
    public bool TryToReadString()
    {
        this.SkipWhitespace();
        
        var match = this.TryToMatch("\'(\\\\\'|[^\'])*\'");
        if (match == null)
        {
            match = this.TryToMatch("\"(\\\\\"|[^\"])*\"");
        }
        if (match == null)
        {
            return false;
        }
        
        var str = match.Substring(1, 1 + match.Length - 2 - 1);
        str = match[0] == '\'' ? str.Replace("\\\'", "\'") : str.Replace("\\\"", "\"");
        this.Tokens.Add(new Token(TokenKind.StringX, str));
        this.Offset += match.Length;
        return true;
    }
    
    public bool Eof()
    {
        return this.Offset >= this.Expression.Length;
    }
    
    public void SkipWhitespace()
    {
        while (!this.Eof())
        {
            var c = this.Expression[this.Offset];
            if (c == ' ' || c == '\n' || c == '\t' || c == '\r')
            {
                this.Offset++;
            }
            else
            {
                break;
            }
        }
    }
    
    public bool TryToReadLiteral()
    {
        var success = this.TryToReadIdentifier() || this.TryToReadNumber() || this.TryToReadString();
        return success;
    }
}

public class TestClass
{
    public void TestMethod()
    {
        var lexer = new ExprLangLexer("1+2", new List<string> { "+" });
        Console.WriteLine($"Token count: {lexer.Tokens.Count}");
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