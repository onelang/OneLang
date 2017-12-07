#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class List {
  public:
    vector<> items;

  private:
};

class Item {
  public:
    int offset;
    string str_test;
    string str_constr;

    Item(string str_constr) {
        this->str_constr = str_constr;
    }

  private:
};

class Container {
  public:
    sp<List> item_list;
    sp<List> string_list;

    void method0() {
    }
    
    void method1(string str) {
        return str;
    }

  private:
};

int main()
{
    TestClass c;
    c.testMethod();
    return 0;
}