#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class ArrayTestClass {
  public:
    void arrayTest() {
        auto constant_arr = vector<int> { 5 };
        return constant_arr.size();
    }

  private:
};

int main()
{
    TestClass c;
    c.testMethod();
    return 0;
}