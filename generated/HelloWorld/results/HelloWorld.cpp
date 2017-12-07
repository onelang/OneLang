#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TestClass {
  public:
    void testMethod() {
        cout << (string("Hello world!")) << endl;
    }

  private:
};

int main()
{
    TestClass c;
    c.testMethod();
    return 0;
}