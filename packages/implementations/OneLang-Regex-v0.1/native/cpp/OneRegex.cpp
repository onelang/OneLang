#include "OneRegex.hpp"

#include <memory>
#include <vector>
#include <regex>

one::vec<std::string> OneRegex::matchFromIndex(const std::string& pattern, const std::string& input, int offset) {
    std::smatch matches;
    if (!std::regex_search(input.begin() + offset, input.end(), matches, std::regex("^" + pattern)))
        return nullptr;

    auto result = std::make_shared<std::vector<std::string>>();
    for(auto match : matches)
        result->push_back(match.str());
    return result;
}
