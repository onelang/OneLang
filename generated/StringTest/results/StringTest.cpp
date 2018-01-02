#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class TestClass {
  public:
    string testMethod() {
        auto x = string("x");
        auto y = string("y");
        
        auto z = string("z");
        z += string("Z");
        z += x;
        
        auto a = string("abcdef").substr(2, 4 - 2);
        auto arr = OneStringHelper::split(string("ab  cd ef"), string(" "));
        
        return z + string("|") + x + y + string("|") + a + string("|") + arr->at(2);
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