#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

enum class SomeKind { EnumVal0, EnumVal1, EnumVal2 };
const char* SomeKindToStr[] = { "EnumVal0", "EnumVal1", "EnumVal2" };

class TestClass {
  public:
    SomeKind enum_field = SomeKind::EnumVal2;

    void testMethod() {
        cout << (string() + "Value: " + SomeKindToStr[(int)(this->enum_field)]) << endl;
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