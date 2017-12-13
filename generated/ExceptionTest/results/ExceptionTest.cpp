#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <stdexcept>
#include <iostream>

class TestClass {
  public:
    int notThrows() {
        return 5;
    }
    
    void fThrows() {
        throw std::runtime_error(string("exception message"));
    }
    
    void testMethod() {
        cout << (this->notThrows()) << endl;
        this->fThrows();
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