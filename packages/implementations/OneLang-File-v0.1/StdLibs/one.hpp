#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>
#include <experimental/any>

class OneFile {
  public:
    static string readText(const string& path)
    {
        ifstream file(path);
        string content((istreambuf_iterator<char>(file)), istreambuf_iterator<char>());
        return content;
    }
};
