#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class TestClass {
  public:
    void methodTest(vec<string> method_param) {
    }
    
    void testMethod() {
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