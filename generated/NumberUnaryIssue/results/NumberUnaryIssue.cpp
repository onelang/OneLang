#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class NumberUnaryIssue {
  public:
    void test(int num) {
        num--;
    }

  private:
};

int main()
{
    TestClass c;
    c.testMethod();
    return 0;
}