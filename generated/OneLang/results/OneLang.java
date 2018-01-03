import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class TokenType {
    public static String endToken = "EndToken";
    public static String whitespace = "Whitespace";
    public static String identifier = "Identifier";
    public static String operatorX = "Operator";
}

class Token {
    public String value;
    public boolean isOperator;

    public Token(String value, boolean isOperator) throws Exception {
        this.value = value;
        this.isOperator = isOperator;
    }
}

class StringHelper {
    public static boolean startsWithAtIndex(String str, String substr, Integer idx) throws Exception
    {
        return str.substring(idx, idx + substr.length()).equals(substr);
    }
}

class Tokenizer {
    public Integer offset;
    public String text;
    public List<String> operators;

    public Tokenizer(String text, List<String> operators) throws Exception {
        this.text = text;
        this.operators = operators;
        this.offset = 0;
    }

    public String getTokenType() throws Exception
    {
        if (this.offset >= this.text.length()) {
            return TokenType.endToken;
        }
        
        char c = this.text.charAt(this.offset);
        return c == ' ' || c == '\n' || c == '\t' || c == '\r' ? TokenType.whitespace : ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || ('0' <= c && c <= '9') || c == '_' ? TokenType.identifier : TokenType.operatorX;
    }
    
    public List<Token> tokenize() throws Exception
    {
        List<Token> result = new ArrayList<Token>(Arrays.asList());
        
        while (this.offset < this.text.length()) {
            String charType = this.getTokenType();
            
            if (charType.equals(TokenType.whitespace)) {
                while (this.getTokenType().equals(TokenType.whitespace)) {
                    this.offset++;
                }
            } else if (charType.equals(TokenType.identifier)) {
                Integer startOffset = this.offset;
                while (this.getTokenType().equals(TokenType.identifier)) {
                    this.offset++;
                }
                String identifier = this.text.substring(startOffset, this.offset);
                result.add(new Token(identifier, false));
            } else {
                String op = "";
                for (String currOp : this.operators) {
                    if (StringHelper.startsWithAtIndex(this.text, currOp, this.offset)) {
                        op = currOp;
                        break;
                    }
                }
                
                if (op.equals("")) {
                    break;
                }
                
                this.offset += op.length();
                result.add(new Token(op, true));
            }
        }
        
        return result;
    }
}

class TestClass {
    public void testMethod() throws Exception
    {
        List<String> operators = new ArrayList<String>(Arrays.asList("<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", "."));
        
        String input = "hello * 5";
        Tokenizer tokenizer = new Tokenizer(input, operators);
        List<Token> result = tokenizer.tokenize();
        
        System.out.println("token count:");
        System.out.println(result.size());
        for (Token item : result) {
            System.out.println(item.value + "(" + (item.isOperator ? "op" : "id") + ")");
        }
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