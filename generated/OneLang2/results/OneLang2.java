import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;

class TokenKind {
    public static String number = "number";
    public static String identifier = "identifier";
    public static String operator_x = "operator";
    public static String string_x = "string";
}

class Token {
    public String kind;
    public String value;

    public Token(String kind, String value) {
        this.value = value;
        this.kind = kind;
    }
}

class ExprLangLexer {
    public Integer offset = 0;
    public List<Token> tokens = new ArrayList<Token>(Arrays.asList());
    public String expression;
    public List<String> operators;

    public ExprLangLexer(String expression, List<String> operators) {
        this.operators = operators;
        this.expression = expression;
        if (!this.tryToReadNumber()) {
            this.tryToReadOperator();
            this.tryToReadLiteral();
        }
        
        while (this.hasMoreToken()) {
            if (!this.tryToReadOperator()) {
                this.fail("expected operator here");
            }
            
            this.tryToReadLiteral();
        }
    }

    public void fail(String message) throws Exception
    {
        String context = this.expression.substring(this.offset, this.offset + 30) + "...";
        throw new Exception("TokenizerException: " + message + " at '" + context + "' (offset: " + this.offset + ")");
    }
    
    public boolean hasMoreToken() throws Exception
    {
        this.skipWhitespace();
        return !this.eof();
    }
    
    public void add(String kind, String value) throws Exception
    {
        this.tokens.add(new Token(kind, value));
        this.offset += value.length();
    }
    
    public String tryToMatch(String pattern) throws Exception
    {
        List<String> matches = OneRegex.matchFromIndex(pattern, this.expression, this.offset);
        return matches.get(0);
    }
    
    public boolean tryToReadOperator() throws Exception
    {
        this.skipWhitespace();
        for (String op : this.operators) {
            if (this.expression.startsWith(op, this.offset)) {
                this.add(TokenKind.operator_x, op);
                return true;
            }
        }
        return false;
    }
    
    public boolean tryToReadNumber() throws Exception
    {
        this.skipWhitespace();
        String number = this.tryToMatch("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)");
        if (number.equals("")) {
            return false;
        }
        
        this.add(TokenKind.number, number);
        if (this.tryToMatch("[0-9a-zA-Z]")) {
            this.fail("invalid character in number");
        }
        
        return true;
    }
    
    public boolean tryToReadIdentifier() throws Exception
    {
        this.skipWhitespace();
        String identifier = this.tryToMatch("[a-zA-Z_][a-zA-Z0-9_]*");
        if (identifier.equals("")) {
            return false;
        }
        
        this.add(TokenKind.identifier, identifier);
        return true;
    }
    
    public boolean tryToReadString() throws Exception
    {
        this.skipWhitespace();
        
        String match = this.tryToMatch("\'(\\\\\'|[^\'])*\'");
        if (match == null) {
            match = this.tryToMatch("\"(\\\\\"|[^\"])*\"");
        }
        if (match == null) {
            return false;
        }
        
        String str = match.substring(1, 1 + match.length() - 2);
        str = match.charAt(0) == '\'' ? str.replace("\\\'", "\'") : str.replace("\\\"", "\"");
        this.tokens.add(new Token(TokenKind.string_x, str));
        this.offset += match.length();
        return true;
    }
    
    public boolean eof() throws Exception
    {
        return this.offset >= this.expression.length();
    }
    
    public void skipWhitespace() throws Exception
    {
        while (!this.eof()) {
            char c = this.expression.charAt(this.offset);
            if (c == ' ' || c == '\n' || c == '\t' || c == '\r') {
                this.offset++;
            } else {
                break;
            }
        }
    }
    
    public boolean tryToReadLiteral() throws Exception
    {
        boolean success = this.tryToReadIdentifier() || this.tryToReadNumber() || this.tryToReadString();
        return success;
    }
}

class TestClass {
    public void testMethod() throws Exception
    {
        ExprLangLexer lexer = new ExprLangLexer("1+2", new ArrayList<String>(Arrays.asList("+")));
        System.out.println("Token count: " + lexer.tokens.size());
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        try {
            new TestClass().testMethod();
        } catch (Exception err) {
            System.out.println("Exception: " + err.getMessage());
        }
    }
}