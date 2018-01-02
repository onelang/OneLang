#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class List {
  public:
    vec<> items;

  private:
};

class Item {
  public:
    int offset = 5;
    string str_test = string("test") + string("test2");
    string str_constr = string("constr");

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