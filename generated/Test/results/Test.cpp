#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TestClass {
  public:
    int mapTest() {
        auto map_obj = map<string, int> {
          { "x", 5 },
          { "y", 3 }
        };
        
        //let containsX = "x" in mapObj;
        map_obj[string("z")] = 9;
        map_obj->erase(string("x"));
        
        auto keys_var = OneMapHelper::keys(map_obj);
        auto values_var = OneMapHelper::values(map_obj);
        return map_obj[string("z")];
    }
    
    void explicitTypeTest() {
        auto op = string("");
        cout << (op.size()) << endl;
    }
    
    string ifTest(int x) {
        auto result = string("<unk>");
        
        if (x > 3) {
            result = string("hello");
        } else if (x < 1) {
            result = string("bello");
        } else if (x < 0) {
            result = string("bello2");
        } else {
            result = string("???");
        }
        
        if (x > 3) {
            result = string("z");
        }
        
        if (x > 3) {
            result = string("x");
        } else {
            result = string("y");
        }
        
        return result;
    }
    
    void arrayTest() {
        //const c2 = new Class2();
        
        auto mutable_arr = make_shared<vector<int>>(initializer_list<int>{ 1, 2 });
        mutable_arr->push_back(3);
        mutable_arr->push_back(4);
        // mutableArr.push(c2.property);
        // mutableArr.push(c2.child.property);
        // mutableArr.push(c2.child.child.property);
        
        auto constant_arr = make_shared<vector<int>>(initializer_list<int>{ 5, 6 });
        
        // some comment
        //   some comment line 2
        for (auto it = mutable_arr->begin(); it != mutable_arr->end(); ++it) {
            auto item = *it;
            cout << (item) << endl;
        }
        
        /* some other comment
           multiline and stuff
        */
        for (int i = 0; i < constant_arr->size(); i++) {
            cout << (constant_arr->at(i)) << endl;
        }
    }
    
    int calc() {
        return (1 + 2) * 3;
    }
    
    int methodWithArgs(int arg1, int arg2, int arg3) {
        int stuff = arg1 + arg2 + arg3 * this->calc();
        return stuff;
    }
    
    string stringTest() {
        auto x = string("x");
        auto y = string("y");
        
        auto z = string("z");
        z += string("Z");
        z += x;
        
        return z + string("|") + x + y;
    }
    
    string reverseString(string str) {
        auto result = string("");
        for (int i = str.size() - 1; i >= 0; i--) {
            result += str[i];
        }
        return result;
    }
    
    bool getBoolResult(bool value) {
        return value;
    }
    
    void testMethod() {
        this->arrayTest();
        cout << (this->mapTest()) << endl;
        cout << (this->stringTest()) << endl;
        cout << (this->reverseString(string("print value"))) << endl;
        cout << (this->getBoolResult(true) ? string("true") : string("false")) << endl;
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