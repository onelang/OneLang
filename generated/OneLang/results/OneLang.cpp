#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class OneMapHelper {
  public:
    template<typename K, typename V> static std::shared_ptr<std::vector<K>> keys(const std::map<K,V>& map) {
        std::vector<K> result;
        for(auto it = map.begin(); it != map.end(); ++it)
            result.push_back(it->first);
        return std::make_shared<std::vector<K>>(result);
    }

    template<typename K, typename V> static std::shared_ptr<std::vector<V>> values(const std::map<K,V>& map) {
        std::vector<V> result;
        for(auto it = map.begin(); it != map.end(); ++it)
            result.push_back(it->second);
        return std::make_shared<std::vector<V>>(result);
    }
};

class OneStringHelper {
  public:
    static std::shared_ptr<std::vector<std::string>> split(const std::string& str, const std::string& delim)
    {
        std::vector<std::string> tokens;
        
        size_t prev = 0, pos = 0;
        do
        {
            pos = str.find(delim, prev);
            if (pos == std::string::npos) pos = str.length();
            std::string token = str.substr(prev, pos - prev);
            tokens.push_back(token);
            prev = pos + delim.length();
        }
        while (pos < str.length() && prev < str.length());

        return std::make_shared<std::vector<std::string>>(tokens);
    }
};

class OneFile {
  public:
    static std::string readText(const std::string& path)
    {
      std::ifstream file(path);
      std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
      return content;
    }
};

class TokenType {
  public:
    static std::string end_token;
    static std::string whitespace;
    static std::string identifier;
    static std::string operator_x;

  private:
};

std::string TokenType::end_token = std::string("EndToken");
std::string TokenType::whitespace = std::string("Whitespace");
std::string TokenType::identifier = std::string("Identifier");
std::string TokenType::operator_x = std::string("Operator");

class Token {
  public:
    std::string value;
    bool is_operator;

    Token(std::string value, bool is_operator) {
        this->is_operator = is_operator;
        this->value = value;
    }

  private:
};

class StringHelper {
  public:
    static bool startsWithAtIndex(std::string str, std::string substr, int idx) {
        return str.substr(idx, idx + substr.size() - idx) == substr;
    }

  private:
};

class Tokenizer {
  public:
    int offset;
    std::string text;
    std::vector<std::string>* operators;

    Tokenizer(std::string text, std::vector<std::string> operators) {
        this->operators = operators;
        this->text = text;
        this->offset = 0;
    }

    std::string getTokenType() {
        if (this->offset >= this->text.size()) {
            return TokenType::end_token;
        }
        
        auto c = this->text[this->offset];
        return c == ' ' || c == '\n' || c == '\t' || c == '\r' ? TokenType::whitespace : ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || ('0' <= c && c <= '9') || c == '_' ? TokenType::identifier : TokenType::operator_x;
    }
    
    std::vector<Token> tokenize() {
        auto result = std::make_shared<std::vector<Token>>(std::vector<Token> {  });
        
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
                result->push_back(std::make_shared<Token>(identifier, false));
            } else {
                auto op = std::string("");
                for (auto it = this->operators->begin(); it != this->operators->end(); ++it) {
                    auto curr_op = *it;
                    if (StringHelper::startsWithAtIndex(this->text, curr_op, this->offset)) {
                        op = curr_op;
                        break;
                    }
                }
                
                if (op == std::string("")) {
                    return nullptr;
                }
                
                this->offset += op.size();
                result->push_back(std::make_shared<Token>(op, true));
            }
        }
        
        return result;
    }

  private:
};

class TestClass {
  public:
    void testMethod() {
        auto operators = std::make_shared<std::vector<std::string>>(std::vector<std::string> { std::string("<<"), std::string(">>"), std::string("++"), std::string("--"), std::string("=="), std::string("!="), std::string("!"), std::string("<"), std::string(">"), std::string("="), std::string("("), std::string(")"), std::string("["), std::string("]"), std::string("{"), std::string("}"), std::string(";"), std::string("+"), std::string("-"), std::string("*"), std::string("/"), std::string("&&"), std::string("&"), std::string("%"), std::string("||"), std::string("|"), std::string("^"), std::string(","), std::string(".") });
        
        auto input = std::string("hello * 5");
        auto tokenizer = std::make_shared<Tokenizer>(input, operators);
        auto result = tokenizer->tokenize();
        
        std::cout << (std::string("token count:")) << std::endl;
        std::cout << (result->size()) << std::endl;
        for (auto it = result->begin(); it != result->end(); ++it) {
            auto item = *it;
            std::cout << (item->value + std::string("(") + (item->is_operator ? std::string("op") : std::string("id")) + std::string(")")) << std::endl;
        }
    }

  private:
};

int main()
{
    TestClass c;
    c.testMethod();
    return 0;
}