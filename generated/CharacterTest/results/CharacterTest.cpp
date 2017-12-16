#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TestClass {
  public:
    void testMethod() {
        auto str = string("a1A");
        for (int i = 0; i < str.size(); i++) {
            auto c = str[i];
            auto is_upper = 'A' <= c && c <= 'Z';
            auto is_lower = 'a' <= c && c <= 'z';
            auto is_number = '0' <= c && c <= '9';
            cout << (is_upper ? string("upper") : is_lower ? string("lower") : is_number ? string("number") : string("other")) << endl;
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