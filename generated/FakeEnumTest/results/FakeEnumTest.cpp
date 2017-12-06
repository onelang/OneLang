#include <memory>
#include <fstream>
#include <vector>
#include <map>

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
    static std::string no_initializer;

  private:
};

std::string TokenType::end_token = std::string("EndToken");
std::string TokenType::whitespace = std::string("Whitespace");
std::string TokenType::identifier = std::string("Identifier");
std::string TokenType::operator_x = std::string("Operator");

class TestClass {
  public:
    std::string testMethod() {
        auto casing_test = TokenType::end_token;
        return casing_test;
    }

  private:
};

int main()
{
    TestClass c;
    c.testMethod();
    return 0;
}