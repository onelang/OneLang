#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>
#include <regex>
#include <experimental/any>

using namespace std;
using namespace std::experimental;

template <typename T>
using sp = shared_ptr<T>;

template <typename T>
using vec = sp<vector<T>>;

class OneMapHelper {
    public:
    template<typename K, typename V> static vec<K> keys(const sp<map<K,V>>& map) {
        vec<K> result = vec<K>();
        for(auto it = map->begin(); it != map->end(); ++it)
            result->push_back(it->first);
        return result;
    }

    template<typename K, typename V> static vec<V> values(const sp<map<K,V>>& map) {
        vec<V> result = vec<V>();
        for(auto it = map->begin(); it != map->end(); ++it)
            result->push_back(it->second);
        return result;
    }
};

class OneStringHelper {
    public:
    static vec<string> split(const string& str, const string& delim)
    {
        vec<string> tokens;
        
        size_t prev = 0, pos = 0;
        do
        {
            pos = str.find(delim, prev);
            if (pos == string::npos) pos = str.length();
            string token = str.substr(prev, pos - prev);
            tokens->push_back(token);
            prev = pos + delim.length();
        }
        while (pos < str.length() && prev < str.length());

        return tokens;
    }

    static string replace(const string& str, const string& from, const string& to) {
        if(from.empty()) return "";

        string result = str;
        size_t start_pos = 0;
        while((start_pos = result.find(from, start_pos)) != string::npos) {
            result.replace(start_pos, from.length(), to);
            start_pos += to.length(); // In case 'to' contains 'from', like replacing 'x' with 'yx'
        }
        return result;
    }
};

class OneFile {
    public:
    static string readText(const string& path)
    {
        ifstream file(path);
        string content((istreambuf_iterator<char>(file)), istreambuf_iterator<char>());
        return content;
    }
};

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