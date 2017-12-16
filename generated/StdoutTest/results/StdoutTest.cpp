#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TestClass {
  public:
    string reverseString(string str) {
        auto result = string("");
        for (int i = str.size() - 1; i >= 0; i--) {
            result += str[i];
        }
        return result;
    }
    
    string testMethod() {
        cout << (this->reverseString(string("print value"))) << endl;
        return string("return value");
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