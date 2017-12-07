#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TestClass {
  public:
    void testMethod() {
        auto result = vector<string> {  };
        auto map = map<string, int> {
          { "x", 5 }
        };
        auto keys = OneMapHelper::keys(map);
        cout << (result) << endl;
        cout << (keys) << endl;
    }

  private:
};

int main()
{
    TestClass c;
    c.testMethod();
    return 0;
}