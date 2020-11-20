#pragma once

#include <string>

class OneFile {
  public:
    static std::string readText(const std::string& path);
    static void writeText(const std::string& path, const std::string& content);
};
