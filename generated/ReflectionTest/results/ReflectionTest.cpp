#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class TargetClass {
  public:
    int instance_field = 5;
    static string static_field;

    static string staticMethod(string arg1) {
        return string() + "arg1 = " + arg1 + ", staticField = " + TargetClass::static_field;
    }
    
    string instanceMethod() {
        return string() + "instanceField = " + to_string(this->instance_field);
    }

  private:
};

string TargetClass::static_field = string("hello");

class TestClass {
  public:
    void testMethod() {
        auto obj = make_shared<TargetClass>();
        //console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
        //console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
        //console.log(`instanceField (direct): ${obj.instanceField}`);
        //console.log(`staticField (direct): ${TargetClass.staticField}`);
        auto cls = OneReflect::getClass(obj);
        if (cls == nullptr) {
            cout << (string("cls is null!")) << endl;
            return;
        }
        auto cls2 = OneReflect::getClassByName(string("TargetClass"));
        if (cls2 == nullptr) {
            cout << (string("cls2 is null!")) << endl;
            return;
        }
        
        auto method1 = cls->getMethod(string("instanceMethod"));
        if (method1 == nullptr) {
            cout << (string("method1 is null!")) << endl;
            return;
        }
        auto method1_result = method1->call(obj, make_shared<vector<any>>(initializer_list<any>{  }));
        cout << (string() + "instanceMethod: " + method1_result) << endl;
        
        auto method2 = cls->getMethod(string("staticMethod"));
        if (method2 == nullptr) {
            cout << (string("method2 is null!")) << endl;
            return;
        }
        auto method2_result = method2->call(nullptr, make_shared<vector<any>>(initializer_list<any>{ string("arg1value") }));
        cout << (string() + "staticMethod: " + method2_result) << endl;
        
        auto field1 = cls->getField(string("instanceField"));
        if (field1 == nullptr) {
            cout << (string("field1 is null!")) << endl;
            return;
        }
        field1->setValue(obj, 6);
        auto field1_new_val = field1->getValue(obj);
        cout << (string() + "new instance field value: " + to_string(obj->instance_field) + " == " + field1_new_val) << endl;
        
        auto field2 = cls->getField(string("staticField"));
        if (field2 == nullptr) {
            cout << (string("field2 is null!")) << endl;
            return;
        }
        field2->setValue(nullptr, string("bello"));
        auto field2_new_val = field2->getValue(nullptr);
        cout << (string() + "new static field value: " + TargetClass::static_field + " == " + field2_new_val) << endl;
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