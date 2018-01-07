#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

template<typename K, typename V>
class MapX {
  public:
    V value;

    void set(K key, V value) {
        this->value = value;
    }
    
    V get(K key) {
        return this->value;
    }

  private:
};

class TestClass {
  public:
    void testMethod() {
        auto map_x = make_shared<MapX<string, int>>();
        map_x->set(string("hello"), 3);
        int num_value = map_x->get(string("hello2"));
        cout << (string() + to_string(num_value)) << endl;
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