#include <string>
#include <fstream>

static std::string OneFile::readText(const std::string& path)
{
    std::ifstream file(path);
    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    return content;
}

static void OneFile::writeText(const std::string& path, const std::string& content)
{
    std::ofstream file(path);
    file << content;
}
