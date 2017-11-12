#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

class OneMapHelper {
  public:
    template<typename K, typename V> static std::shared_ptr<std::vector<K>> keys(const std::map<K,V>& map) {
        std::vector<K> result;
        for(auto it = map.begin(); it != map.end(); ++it)
            result.push_back(it->first);
        return std::make_shared<std::vector<K>>(result);
    }

    template<typename K, typename V> static std::shared_ptr<std::vector<V>> values(const std::map<K,V>& map) {
        std::vector<V> result;
        for(auto it = map.begin(); it != map.end(); ++it)
            result.push_back(it->second);
        return std::make_shared<std::vector<V>>(result);
    }
};

class OneStringHelper {
  public:
    static std::shared_ptr<std::vector<std::string>> split(const std::string& str, const std::string& delim)
    {
        std::vector<std::string> tokens;
        
        size_t prev = 0, pos = 0;
        do
        {
            pos = str.find(delim, prev);
            if (pos == std::string::npos) pos = str.length();
            std::string token = str.substr(prev, pos - prev);
            tokens.push_back(token);
            prev = pos + delim.length();
        }
        while (pos < str.length() && prev < str.length());

        return std::make_shared<std::vector<std::string>>(tokens);
    }
};

class OneFile {
  public:
    static std::string readText(const std::string& path)
    {
      std::ifstream file(path);
      std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
      return content;
    }
};

class TestClass {
  public:
    int mapTest() {
        auto map_obj = std::make_shared<std::map<std::string, int>>(std::map<std::string, int> {
          { "x", 5 },
          { "y", 3 }
        });
        
        //let containsX = "x" in mapObj;
        (*map_obj)[std::string("z")] = 9;
        map_obj->erase(std::string("x"));
        
        auto keys_var = OneMapHelper::keys(*map_obj);
        auto values_var = OneMapHelper::values(*map_obj);
        return (*map_obj)[std::string("z")];
    }
    
    void explicitTypeTest() {
        auto op = std::string("");
        std::cout << (op.size()) << std::endl;
    }
    
    std::string ifTest(int x) {
        auto result = std::string("<unk>");
        
        if (x > 3) {
            result = std::string("hello");
        } else if (x < 1) {
            result = std::string("bello");
        } else if (x < 0) {
            result = std::string("bello2");
        }   else {
        result = std::string("???");
          }
        
        if (x > 3) {
            result = std::string("z");
        }
        
        if (x > 3) {
            result = std::string("x");
        }   else {
        result = std::string("y");
          }
        
        return result;
    }
    
    void arrayTest() {
        //const c2 = new Class2();
        
        auto mutable_arr = std::make_shared<std::vector<int>>(std::vector<int> { 1, 2 });
        mutable_arr->push_back(3);
        mutable_arr->push_back(4);
        // mutableArr.push(c2.property);
        // mutableArr.push(c2.child.property);
        // mutableArr.push(c2.child.child.property);
        
        auto constant_arr = std::make_shared<std::vector<int>>(std::vector<int> { 5, 6 });
        
        // some comment
        //   some comment line 2
        for (auto it = mutable_arr->begin(); it != mutable_arr->end(); ++it) {
            auto item = *it;
            std::cout << (item) << std::endl;
        }
        
        /* some other comment
           multiline and stuff
        */
        for (int i = 0; i < constant_arr->size(); i++) {
            std::cout << (constant_arr->at(i)) << std::endl;
        }
    }
    
    int calc() {
        return (1 + 2) * 3;
    }
    
    int methodWithArgs(int arg1, int arg2, int arg3) {
        int stuff = arg1 + arg2 + arg3 * this->calc();
        return stuff;
    }
    
    std::string stringTest() {
        auto x = std::string("x");
        auto y = std::string("y");
        
        auto z = std::string("z");
        z += std::string("Z");
        z += x;
        
        return z + std::string("|") + x + y;
    }
    
    std::string reverseString(std::string str) {
        auto result = std::string("");
        for (int i = str.size() - 1; i >= 0; i--) {
            result += str.substr(i, 1);
        }
        return result;
    }
    
    bool getBoolResult(bool value) {
        return value;
    }
    
    void testMethod() {
        this->arrayTest();
        std::cout << (this->mapTest()) << std::endl;
        std::cout << (this->stringTest()) << std::endl;
        std::cout << (this->reverseString(std::string("print value"))) << std::endl;
        std::cout << (this->getBoolResult(true) ? std::string("true") : std::string("false")) << std::endl;
    }

  private:
    
    
    
};



int main()
{
    TestClass c;
    c.testMethod();
    return 0;
}