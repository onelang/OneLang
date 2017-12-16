#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class TokenType {
  public:
    static string end_token;
    static string whitespace;
    static string identifier;
    static string operator_x;
    static string no_initializer;

  private:
};

string TokenType::end_token = string("EndToken");
string TokenType::whitespace = string("Whitespace");
string TokenType::identifier = string("Identifier");
string TokenType::operator_x = string("Operator");

class TestClass {
  public:
    string testMethod() {
        auto casing_test = TokenType::end_token;
        return casing_test;
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