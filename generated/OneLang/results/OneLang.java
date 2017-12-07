import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;

class TokenType {
    public static String end_token = "EndToken";
    public static String whitespace = "Whitespace";
    public static String identifier = "Identifier";
    public static String operator_x = "Operator";
}

class Token {
    public String value;
    public boolean is_operator;

    public Token(String value, boolean is_operator) {
        this.is_operator = is_operator;
        this.value = value;
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

    public Tokenizer(String text, List<String> operators) {
        this.operators = operators;
        this.text = text;
        this.offset = 0;
    }

    public String getTokenType() throws Exception
    {
        if (this.offset >= this.text.length()) {
            return TokenType.end_token;
        }
        
        char c = this.text.charAt(this.offset);
        return c == ' ' || c == '\n' || c == '\t' || c == '\r' ? TokenType.whitespace : ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || ('0' <= c && c <= '9') || c == '_' ? TokenType.identifier : TokenType.operator_x;
    }
    
    public List<Token> tokenize() throws Exception
    {
        List<Token> result = new ArrayList<Token>(Arrays.asList());
        
        while (this.offset < this.text.length()) {
            String char_type = this.getTokenType();
            
            if (char_type.equals(TokenType.whitespace)) {
                while (this.getTokenType().equals(TokenType.whitespace)) {
                    this.offset++;
                }
            } else if (char_type.equals(TokenType.identifier)) {
                Integer start_offset = this.offset;
                while (this.getTokenType().equals(TokenType.identifier)) {
                    this.offset++;
                }
                String identifier = this.text.substring(start_offset, this.offset);
                result.add(new Token(identifier, false));
            } else {
                String op = "";
                for (String curr_op : this.operators) {
                    if (StringHelper.startsWithAtIndex(this.text, curr_op, this.offset)) {
                        op = curr_op;
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
            System.out.println(item.value + "(" + (item.is_operator ? "op" : "id") + ")");
        }
    }
}

class Program {
    public static void main(String[] args) throws Exception {
        new TestClass().testMethod();
    }
}