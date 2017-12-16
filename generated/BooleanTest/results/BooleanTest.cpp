#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TestClass {
  public:
    void testMethod() {
        auto a = true;
        auto b = false;
        auto c = a && b;
        auto d = a || b;
        cout << (string() + "a: " + ((a) ? "true" : "false") + ", b: " + ((b) ? "true" : "false") + ", c: " + ((c) ? "true" : "false") + ", d: " + ((d) ? "true" : "false")) << endl;
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