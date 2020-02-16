#include "OneFile.hpp"
#include <string>
#include <fstream>

std::string OneFile::readText(const std::string& path)
{
    std::ifstream file(path);
    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    return content;
}

void OneFile::writeText(const std::string& path, const std::string& content)
{
    std::ofstream file(path);
    file << content;
}
