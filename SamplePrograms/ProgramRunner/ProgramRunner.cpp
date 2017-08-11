#include <iostream>

class TestClass {
    public:
    void testMethod() {
        std::cout << "Hello World!\n";
    }
};

int main()
{
    TestClass c;
    c.testMethod();
    return 0;
}
