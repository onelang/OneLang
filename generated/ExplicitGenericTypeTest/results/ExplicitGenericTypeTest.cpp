#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TestClass {
  public:
    void testMethod() {
        auto result = make_shared<vector<string>>(initializer_list<string>{  });
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
    try {
        TestClass c;
        c.testMethod();
    } catch(std::exception& err) {
        cout << "Exception: " << err.what() << '\n';
    }
    return 0;
}