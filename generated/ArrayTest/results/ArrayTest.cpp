#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TestClass {
  public:
    void testMethod() {
        auto constant_arr = vector<int> { 5 };
        
        auto mutable_arr = vector<int> { 1 };
        mutable_arr.push_back(2);
        
        cout << (string() + "len1: " + to_string(constant_arr.size()) + ", len2: " + to_string(mutable_arr.size())) << endl;
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