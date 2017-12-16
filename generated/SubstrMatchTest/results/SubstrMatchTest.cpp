#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TestClass {
  public:
    void testMethod() {
        auto str = string("ABCDEF");
        auto t_a0_true = str.compare(0, string("A").size(), string("A")) == 0;
        auto t_a1_false = str.compare(1, string("A").size(), string("A")) == 0;
        auto t_b1_true = str.compare(1, string("B").size(), string("B")) == 0;
        auto t_c_d2_true = str.compare(2, string("CD").size(), string("CD")) == 0;
        cout << (string() + ((t_a0_true) ? "true" : "false") + " " + ((t_a1_false) ? "true" : "false") + " " + ((t_b1_true) ? "true" : "false") + " " + ((t_c_d2_true) ? "true" : "false")) << endl;
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