#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TokenType {
  public:
    static string end_token;
    static string whitespace;
    static string identifier;
    static string operator_x;

  private:
};

string TokenType::end_token = string("EndToken");
string TokenType::whitespace = string("Whitespace");
string TokenType::identifier = string("Identifier");
string TokenType::operator_x = string("Operator");

class Token {
  public:
    string value;
    bool is_operator;

    Token(string value, bool is_operator) {
        this->value = value;
        this->is_operator = is_operator;
    }

  private:
};

class StringHelper {
  public:
    static bool startsWithAtIndex(string str, string substr, int idx) {
        return str.substr(idx, idx + substr.size() - idx) == substr;
    }

  private:
};

class Tokenizer {
  public:
    int offset;
    string text;
    vec<string> operators;

    Tokenizer(string text, vec<string> operators) {
        this->text = text;
        this->operators = operators;
        this->offset = 0;
    }

    string getTokenType() {
        if (this->offset >= this->text.size()) {
            return TokenType::end_token;
        }
        
        auto c = this->text[this->offset];
        return c == ' ' || c == '\n' || c == '\t' || c == '\r' ? TokenType::whitespace : ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || ('0' <= c && c <= '9') || c == '_' ? TokenType::identifier : TokenType::operator_x;
    }
    
    vec<sp<Token>> tokenize() {
        auto result = make_shared<vector<sp<Token>>>(initializer_list<sp<Token>>{  });
        
        while (this->offset < this->text.size()) {
            auto char_type = this->getTokenType();
            
            if (char_type == TokenType::whitespace) {
                while (this->getTokenType() == TokenType::whitespace) {
                    this->offset++;
                }
            } else if (char_type == TokenType::identifier) {
                int start_offset = this->offset;
                while (this->getTokenType() == TokenType::identifier) {
                    this->offset++;
                }
                auto identifier = this->text.substr(start_offset, this->offset - start_offset);
                result->push_back(make_shared<Token>(identifier, false));
            } else {
                auto op = string("");
                for (auto it = this->operators->begin(); it != this->operators->end(); ++it) {
                    auto curr_op = *it;
                    if (StringHelper::startsWithAtIndex(this->text, curr_op, this->offset)) {
                        op = curr_op;
                        break;
                    }
                }
                
                if (op == string("")) {
                    break;
                }
                
                this->offset += op.size();
                result->push_back(make_shared<Token>(op, true));
            }
        }
        
        return result;
    }

  private:
};

class TestClass {
  public:
    void testMethod() {
        auto operators = make_shared<vector<string>>(initializer_list<string>{ string("<<"), string(">>"), string("++"), string("--"), string("=="), string("!="), string("!"), string("<"), string(">"), string("="), string("("), string(")"), string("["), string("]"), string("{"), string("}"), string(";"), string("+"), string("-"), string("*"), string("/"), string("&&"), string("&"), string("%"), string("||"), string("|"), string("^"), string(","), string(".") });
        
        auto input = string("hello * 5");
        auto tokenizer = make_shared<Tokenizer>(input, operators);
        auto result = tokenizer->tokenize();
        
        cout << (string("token count:")) << endl;
        cout << (result->size()) << endl;
        for (auto it = result->begin(); it != result->end(); ++it) {
            auto item = *it;
            cout << (item->value + string("(") + (item->is_operator ? string("op") : string("id")) + string(")")) << endl;
        }
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