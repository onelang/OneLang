<?php

class TokenKind { 
    const Number = 0;
    const Identifier = 1;
    const Operator_ = 2;
    const String_ = 3;
};

class Token {
    public $kind;
    public $value;

    function __construct($kind, $value) {
        $this->kind = $kind;
        $this->value = $value;
    }
}

class ExprLangLexer {
    public $offset = 0;
    public $tokens = array();
    public $expression;
    public $operators;

    function __construct($expression, $operators) {
        $this->expression = $expression;
        $this->operators = $operators;
        if (!$this->tryToReadNumber()) {
            $this->tryToReadOperator();
            $this->tryToReadLiteral();
        }
        
        while ($this->hasMoreToken()) {
            if (!$this->tryToReadOperator()) {
                $this->fail("expected operator here");
            }
            
            if (!$this->tryToReadLiteral()) {
                $this->fail("expected literal here");
            }
        }
    }

    function fail($message) {
        $end_offset = $this->offset + 30;
        if ($end_offset > strlen($this->expression)) {
            $end_offset = strlen($this->expression);
        }
        $context = substr($this->expression, $this->offset, $end_offset - $this->offset) . "...";
        throw new Exception("TokenizerException: " . ($message) . " at '" . ($context) . "' (offset: " . ($this->offset) . ")");
    }
    
    function hasMoreToken() {
        $this->skipWhitespace();
        return !$this->eof();
    }
    
    function add($kind, $value) {
        $this->tokens[] = new Token($kind, $value);
        $this->offset += strlen($value);
    }
    
    function tryToMatch($pattern) {
        $matches = OneRegex::matchFromIndex($pattern, $this->expression, $this->offset);
        return $matches == NULL ? "" : ($matches[0]);
    }
    
    function tryToReadOperator() {
        $this->skipWhitespace();
        foreach ($this->operators as $op) {
            if (substr_compare($this->expression, $op, $this->offset, strlen($op)) === 0) {
                $this->add(TokenKind::Operator_, $op);
                return TRUE;
            }
        }
        return FALSE;
    }
    
    function tryToReadNumber() {
        $this->skipWhitespace();
        
        $number = $this->tryToMatch("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)");
        if ($number == "") {
            return FALSE;
        }
        
        $this->add(TokenKind::Number, $number);
        
        if ($this->tryToMatch("[0-9a-zA-Z]") != "") {
            $this->fail("invalid character in number");
        }
        
        return TRUE;
    }
    
    function tryToReadIdentifier() {
        $this->skipWhitespace();
        $identifier = $this->tryToMatch("[a-zA-Z_][a-zA-Z0-9_]*");
        if ($identifier == "") {
            return FALSE;
        }
        
        $this->add(TokenKind::Identifier, $identifier);
        return TRUE;
    }
    
    function tryToReadString() {
        $this->skipWhitespace();
        
        $match = $this->tryToMatch("'(\\\\'|[^'])*'");
        if ($match == "") {
            $match = $this->tryToMatch("\"(\\\\\"|[^\"])*\"");
        }
        if ($match == "") {
            return FALSE;
        }
        
        $str = substr($match, 1, 1 + strlen($match) - 2 - 1);
        $str = $match[0] == "'" ? str_replace("\\'", "'", $str) : (str_replace("\\\"", "\"", $str));
        $this->tokens[] = new Token(TokenKind::String_, $str);
        $this->offset += strlen($match);
        return TRUE;
    }
    
    function eof() {
        return $this->offset >= strlen($this->expression);
    }
    
    function skipWhitespace() {
        while (!$this->eof()) {
            $c = $this->expression[$this->offset];
            if ($c == " " || $c == "\n" || $c == "\t" || $c == "\r") {
                $this->offset++;
            } else {
                break;
            }
        }
    }
    
    function tryToReadLiteral() {
        $success = $this->tryToReadIdentifier() || $this->tryToReadNumber() || $this->tryToReadString();
        return $success;
    }
}

class TestClass {
    function testMethod() {
        $lexer = new ExprLangLexer("1+2", array("+"));
        $result = "";
        foreach ($lexer->tokens as $token) {
            if ($result != "") {
                $result .= ", ";
            }
            $result .= $token->value;
        }
        
        print(("[" . (count($lexer->tokens)) . "]: " . ($result) . "") . "\n");
    }
}

try {
    $c = new TestClass();
    $c->testMethod();
} catch (Exception $err) {
    echo 'Exception: ' . $err->getMessage() . "\n";
}