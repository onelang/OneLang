#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <stdexcept>
#include <iostream>

class TokenKind {
  public:
    static string number;
    static string identifier;
    static string operator_x;
    static string string_x;

  private:
};

string TokenKind::number = string("number");
string TokenKind::identifier = string("identifier");
string TokenKind::operator_x = string("operator");
string TokenKind::string_x = string("string");

class Token {
  public:
    string kind;
    string value;

    Token(string kind, string value) {
        this->value = value;
        this->kind = kind;
    }

  private:
};

class ExprLangLexer {
  public:
    int offset;
    vector<sp<Token>> tokens;
    string expression;
    vector<string> operators;

    ExprLangLexer(string expression, vector<string> operators) {
        this->operators = operators;
        this->expression = expression;
        if (!this->tryToReadNumber()) {
            this->tryToReadOperator();
            this->tryToReadLiteral();
        }
        
        while (this->hasMoreToken()) {
            if (!this->tryToReadOperator()) {
                this->fail(string("expected operator here"));
            }
            
            this->tryToReadLiteral();
        }
    }

    void fail(string message) {
        auto context = this->expression.substr(this->offset, this->offset + 30 - this->offset) + string("...");
        throw std::runtime_error(string() + "TokenizerException: " + message + " at '" + context + "' (offset: " + to_string(this->offset) + ")");
    }
    
    bool hasMoreToken() {
        this->skipWhitespace();
        return !this->eof();
    }
    
    void add(string kind, string value) {
        this->tokens.push_back(make_shared<Token>(kind, value));
        this->offset += value.size();
    }
    
    string tryToMatch(string pattern) {
        auto matches = OneRegex::matchFromIndex(pattern, this->expression, this->offset);
        return matches.at(0);
    }
    
    bool tryToReadOperator() {
        this->skipWhitespace();
        for (auto it = this->operators.begin(); it != this->operators.end(); ++it) {
            auto op = *it;
            if (this->expression.compare(this->offset, op.size(), op) == 0) {
                this->add(TokenKind::operator_x, op);
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
        
        this->add(TokenKind::number, number);
        if (this->tryToMatch(string("[0-9a-zA-Z]"))) {
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
        
        this->add(TokenKind::identifier, identifier);
        return true;
    }
    
    bool tryToReadString() {
        this->skipWhitespace();
        
        auto match = this->tryToMatch(string("\'(\\\\\'|[^\'])*\'"));
        if (match == nullptr) {
            match = this->tryToMatch(string("\"(\\\\\"|[^\"])*\""));
        }
        if (match == nullptr) {
            return false;
        }
        
        auto str = match.substr(1, 1 + match.size() - 2 - 1);
        str = match[0] == '\'' ? OneStringHelper::replace(str, string("\\\'"), string("\'")) : OneStringHelper::replace(str, string("\\\""), string("\""));
        this->tokens.push_back(make_shared<Token>(TokenKind::string_x, str));
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
        auto lexer = make_shared<ExprLangLexer>(string("1+2"), vector<string> { string("+") });
        cout << (string() + "Token count: " + to_string(lexer->tokens.size())) << endl;
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