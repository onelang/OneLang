#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>
#include <experimental/any>

class OneRegex {
  public:
    static vec<string> matchFromIndex(const string& pattern, const string& input, int offset) {
        smatch matches;
        if (!regex_search(input.begin() + offset, input.end(), matches, regex("^" + pattern)))
            return nullptr;

        auto result = make_shared<vector<string>>();
        for(auto match : matches)
            result->push_back(match.str());
        return result;
    }
};
