#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

enum class TestEnum { Item1, Item2 };
const char* TestEnumToStr[] = { "Item1", "Item2" };

class TestClass {
  public:
    void testMethod() {
        auto enum_v = TestEnum::Item1;
        if (3 * 2 == 6) {
            enum_v = TestEnum::Item2;
        }
        
        auto check1 = enum_v == TestEnum::Item2 ? string("SUCCESS") : string("FAIL");
        auto check2 = enum_v == TestEnum::Item1 ? string("FAIL") : string("SUCCESS");
        
        cout << (string() + "Item1: " + TestEnumToStr[(int)(TestEnum::Item1)] + ", Item2: " + TestEnumToStr[(int)(enum_v)] + ", checks: " + check1 + " " + check2) << endl;
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