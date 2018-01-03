<?php

class TokenType {
    public static $end_token = "EndToken";
    public static $whitespace = "Whitespace";
    public static $identifier = "Identifier";
    public static $operator_x = "Operator";
}

class Token {
    public $value;
    public $is_operator;

    function __construct($value, $is_operator) {
        $this->value = $value;
        $this->is_operator = $is_operator;
    }
}

class StringHelper {
    static function startsWithAtIndex($str, $substr, $idx) {
        return substr($str, $idx, $idx + strlen($substr) - $idx) == $substr;
    }
}

class Tokenizer {
    public $offset;
    public $text;
    public $operators;

    function __construct($text, $operators) {
        $this->text = $text;
        $this->operators = $operators;
        $this->offset = 0;
    }

    function getTokenType() {
        if ($this->offset >= strlen($this->text)) {
            return TokenType::$end_token;
        }
        
        $c = $this->text[$this->offset];
        return $c == " " || $c == "\n" || $c == "\t" || $c == "\r" ? TokenType::$whitespace : (("A" <= $c && $c <= "Z") || ("a" <= $c && $c <= "z") || ("0" <= $c && $c <= "9") || $c == "_" ? TokenType::$identifier : (TokenType::$operator_x));
    }
    
    function tokenize() {
        $result = array();
        
        while ($this->offset < strlen($this->text)) {
            $char_type = $this->getTokenType();
            
            if ($char_type == TokenType::$whitespace) {
                while ($this->getTokenType() == TokenType::$whitespace) {
                    $this->offset++;
                }
            } elseif ($char_type == TokenType::$identifier) {
                $start_offset = $this->offset;
                while ($this->getTokenType() == TokenType::$identifier) {
                    $this->offset++;
                }
                $identifier = substr($this->text, $start_offset, $this->offset - $start_offset);
                $result[] = new Token($identifier, FALSE);
            } else {
                $op = "";
                foreach ($this->operators as $curr_op) {
                    if (StringHelper::startsWithAtIndex($this->text, $curr_op, $this->offset)) {
                        $op = $curr_op;
                        break;
                    }
                }
                
                if ($op == "") {
                    break;
                }
                
                $this->offset += strlen($op);
                $result[] = new Token($op, TRUE);
            }
        }
        
        return $result;
    }
}

class TestClass {
    function testMethod() {
        $operators = array("<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", ".");
        
        $input = "hello * 5";
        $tokenizer = new Tokenizer($input, $operators);
        $result = $tokenizer->tokenize();
        
        print(("token count:") . "\n");
        print((count($result)) . "\n");
        foreach ($result as $item) {
            print(($item->value . "(" . ($item->is_operator ? "op" : ("id")) . ")") . "\n");
        }
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}