#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class ConstructorTest {
  public:
    int field2;
    int field1;

    ConstructorTest(int field1) {
        this->field1 = field1;
        this->field2 = field1 * this->field1 * 5;
    }

  private:
};

class TestClass {
  public:
    void testMethod() {
        auto test = make_shared<ConstructorTest>(3);
        cout << (test->field2) << endl;
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