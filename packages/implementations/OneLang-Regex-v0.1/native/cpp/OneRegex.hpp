#pragma once

#include <OneLang-Core-v0.1/one.hpp>
#include <string>

class OneRegex {
  public:
    static one::vec<std::string> matchFromIndex(const std::string& pattern, const std::string& input, int offset);
};
