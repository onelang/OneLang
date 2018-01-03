#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <stdexcept>
#include <iostream>

enum class TokenKind { Number, Identifier, Operator_, String_ };
const char* TokenKindToStr[] = { "Number", "Identifier", "Operator_", "String_" };

class Token {
  public:
    TokenKind kind;
    string value;

    Token(TokenKind kind, string value) {
        this->kind = kind;
        this->value = value;
    }

  private:
};

class ExprLangLexer {
  public:
    int offset = 0;
    vec<sp<Token>> tokens = make_shared<vector<sp<Token>>>(initializer_list<sp<Token>>{  });
    string expression;
    vec<string> operators;

    ExprLangLexer(string expression, vec<string> operators) {
        this->expression = expression;
        this->operators = operators;
        if (!this->tryToReadNumber()) {
            this->tryToReadOperator();
            this->tryToReadLiteral();
        }
        
        while (this->hasMoreToken()) {
            if (!this->tryToReadOperator()) {
                this->fail(string("expected operator here"));
            }
            
            if (!this->tryToReadLiteral()) {
                this->fail(string("expected literal here"));
            }
        }
    }

    void fail(string message) {
        int end_offset = this->offset + 30;
        if (end_offset > this->expression.size()) {
            end_offset = this->expression.size();
        }
        auto context = this->expression.substr(this->offset, end_offset - this->offset) + string("...");
        throw std::runtime_error(string() + "TokenizerException: " + message + " at '" + context + "' (offset: " + to_string(this->offset) + ")");
    }
    
    bool hasMoreToken() {
        this->skipWhitespace();
        return !this->eof();
    }
    
    void add(TokenKind kind, string value) {
        this->tokens->push_back(make_shared<Token>(kind, value));
        this->offset += value.size();
    }
    
    string tryToMatch(string pattern) {
        auto matches = OneRegex::matchFromIndex(pattern, this->expression, this->offset);
        return matches == nullptr ? string("") : matches->at(0);
    }
    
    bool tryToReadOperator() {
        this->skipWhitespace();
        for (auto it = this->operators->begin(); it != this->operators->end(); ++it) {
            auto op = *it;
            if (this->expression.compare(this->offset, op.size(), op) == 0) {
                this->add(TokenKind::Operator_, op);
                return true;
            }
        }
        return false;
    }
    
    bool tryToReadNumber() {
        this->skipWhitespace();
        
        auto number = this->tryToMatch(string("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)"));
        if (number == string("")) {
            return false;
        }
        
        this->add(TokenKind::Number, number);
        
        if (this->tryToMatch(string("[0-9a-zA-Z]")) != string("")) {
            this->fail(string("invalid character in number"));
        }
        
        return true;
    }
    
    bool tryToReadIdentifier() {
        this->skipWhitespace();
        auto identifier = this->tryToMatch(string("[a-zA-Z_][a-zA-Z0-9_]*"));
        if (identifier == string("")) {
            return false;
        }
        
        this->add(TokenKind::Identifier, identifier);
        return true;
    }
    
    bool tryToReadString() {
        this->skipWhitespace();
        
        auto match = this->tryToMatch(string("'(\\\\'|[^'])*'"));
        if (match == string("")) {
            match = this->tryToMatch(string("\"(\\\\\"|[^\"])*\""));
        }
        if (match == string("")) {
            return false;
        }
        
        auto str = match.substr(1, 1 + match.size() - 2 - 1);
        str = match[0] == '\'' ? OneStringHelper::replace(str, string("\\'"), string("'")) : OneStringHelper::replace(str, string("\\\""), string("\""));
        this->tokens->push_back(make_shared<Token>(TokenKind::String_, str));
        this->offset += match.size();
        return true;
    }
    
    bool eof() {
        return this->offset >= this->expression.size();
    }
    
    void skipWhitespace() {
        while (!this->eof()) {
            auto c = this->expression[this->offset];
            if (c == ' ' || c == '\n' || c == '\t' || c == '\r') {
                this->offset++;
            } else {
                break;
            }
        }
    }
    
    bool tryToReadLiteral() {
        auto success = this->tryToReadIdentifier() || this->tryToReadNumber() || this->tryToReadString();
        return success;
    }

  private:
};

class TestClass {
  public:
    void testMethod() {
        auto lexer = make_shared<ExprLangLexer>(string("1+2"), make_shared<vector<string>>(initializer_list<string>{ string("+") }));
        auto result = string("");
        for (auto it = lexer->tokens->begin(); it != lexer->tokens->end(); ++it) {
            auto token = *it;
            if (result != string("")) {
                result += string(", ");
            }
            result += token->value;
        }
        
        cout << (string() + "[" + to_string(lexer->tokens->size()) + "]: " + result) << endl;
    }

  private:
};

int main()
{
    try {
        TestClass c;
        c.testMethod();
    } catch(std::exception& err) {
        cout << "Exception: " << err.what() << '\n';
    }
    return 0;
}