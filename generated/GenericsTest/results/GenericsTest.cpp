#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class MapX {
  public:
    void set( key,  value) {
    }
    
     get( key) {
        return nullptr;
    }

  private:
};

class Main {
  public:
    void test() {
        auto map = make_shared<MapX>();
        map->set(string("hello"), 3);
        int num_value = map->get(string("hello2"));
    }

  private:
};