#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TestClass {
  public:
    bool getResult() {
        return true;
    }
    
    void testMethod() {
        cout << (this->getResult() ? string("true") : string("false")) << endl;
    }

  private:
};

int main()
{
    TestClass c;
    c.testMethod();
    return 0;
}