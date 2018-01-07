using System;
using System.Collections.Generic;

public enum TokenKind { Number, Identifier, Operator_, String_ }

public class Token
{
    public TokenKind Kind;
    public string Value;

    public Token(TokenKind kind, string value)
    {
        this.Kind = kind;
        this.Value = value;
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
        this.Expression = expression;
        this.Operators = operators;
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
            
            if (!this.TryToReadLiteral())
            {
                this.Fail("expected literal here");
            }
        }
    }

    public void Fail(string message)
    {
        var endOffset = this.Offset + 30;
        if (endOffset > this.Expression.Length)
        {
            endOffset = this.Expression.Length;
        }
        var context = this.Expression.Substring(this.Offset, endOffset - this.Offset) + "...";
        throw new Exception($"TokenizerException: {message} at '{context}' (offset: {this.Offset})");
    }
    
    public bool HasMoreToken()
    {
        this.SkipWhitespace();
        return !this.Eof();
    }
    
    public void Add(TokenKind kind, string value)
    {
        this.Tokens.Add(new Token(kind, value));
        this.Offset += value.Length;
    }
    
    public string TryToMatch(string pattern)
    {
        var matches = OneRegex.MatchFromIndex(pattern, this.Expression, this.Offset);
        return matches == null ? "" : matches[0];
    }
    
    public bool TryToReadOperator()
    {
        this.SkipWhitespace();
        foreach (var op in this.Operators)
        {
            if (String.Compare(this.Expression, this.Offset, op, 0, (op).Length) == 0)
            {
                this.Add(TokenKind.Operator_, op);
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
        
        if (this.TryToMatch("[0-9a-zA-Z]") != "")
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
        
        var match = this.TryToMatch("'(\\\\'|[^'])*'");
        if (match == "")
        {
            match = this.TryToMatch("\"(\\\\\"|[^\"])*\"");
        }
        if (match == "")
        {
            return false;
        }
        
        var str = match.Substring(1, 1 + match.Length - 2 - 1);
        str = match[0] == '\'' ? str.Replace("\\'", "'") : str.Replace("\\\"", "\"");
        this.Tokens.Add(new Token(TokenKind.String_, str));
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
        var result = "";
        foreach (var token in lexer.Tokens)
        {
            if (result != "")
            {
                result += ", ";
            }
            result += token.Value;
        }
        
        Console.WriteLine($"[{lexer.Tokens.Count}]: {result}");
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