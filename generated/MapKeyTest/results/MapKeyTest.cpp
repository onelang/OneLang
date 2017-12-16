#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class TestClass {
  public:
    void testMethod() {
        auto map = map<string, any> {
        };
        auto keys = OneMapHelper::keys(map);
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