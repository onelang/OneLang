#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>

using namespace std;

template <typename T>
using sp = shared_ptr<T>;

class OneMapHelper {
    public:
    template<typename K, typename V> static vector<K> keys(const map<K,V>& map) {
        vector<K> result;
        for(auto it = map.begin(); it != map.end(); ++it)
            result.push_back(it->first);
        return result;
    }

    template<typename K, typename V> static vector<V> values(const map<K,V>& map) {
        vector<V> result;
        for(auto it = map.begin(); it != map.end(); ++it)
            result.push_back(it->second);
        return result;
    }
};

class OneStringHelper {
    public:
    static vector<string> split(const string& str, const string& delim)
    {
        vector<string> tokens;
        
        size_t prev = 0, pos = 0;
        do
        {
            pos = str.find(delim, prev);
            if (pos == string::npos) pos = str.length();
            string token = str.substr(prev, pos - prev);
            tokens.push_back(token);
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
