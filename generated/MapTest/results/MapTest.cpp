#include <one.hpp>
#include <memory>
#include <fstream>
#include <vector>
#include <map>

class MapTestClass {
  public:
    void mapTest() {
        auto map_obj = map<string, int> {
          { "x", 5 }
        };
        //let containsX = "x" in mapObj;
        //delete mapObj["x"];
        map_obj[string("x")] = 3;
        return map_obj[string("x")];
    }

  private:
};