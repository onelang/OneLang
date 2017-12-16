#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>
#include <string>

class TestClass {
  public:
    void testMethod() {
        auto str_val = string("str");
        int num = 1337;
        auto b = true;
        auto result = string() + "before " + str_val + ", num: " + to_string(num) + ", true: " + ((b) ? "true" : "false") + " after";
        cout << (result) << endl;
        cout << (string() + "before " + str_val + ", num: " + to_string(num) + ", true: " + ((b) ? "true" : "false") + " after") << endl;
        
        auto result2 = string("before ") + str_val + string(", num: ") + to_string(num) + string(", true: ") + (b ? "true" : "false") + string(" after");
        cout << (result2) << endl;
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