#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class TestClass {
  public:
    string testMethod() {
        auto file_content = OneFile::readText(string("../../input/test.txt"));
        return file_content;
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