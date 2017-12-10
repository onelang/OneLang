#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <stdexcept>

class TestClass {
  public:
    void testMethod() {
        throw std::runtime_error(string("exception message"));
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