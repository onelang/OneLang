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

template<class Key, class T>
std::shared_ptr<std::map<Key,T>> make_shared_map(std::initializer_list<typename std::map<Key,T>::value_type> il)
{
    return std::make_shared<std::map<Key,T>>(il);
}

class OneMapHelper {
  public:
    template<typename K, typename V>
    static vec<K> keys(const sp<map<K,V>>& map) {
        vec<K> result = make_shared<vector<K>>();
        for(auto it = map->begin(); it != map->end(); ++it)
            result->push_back(it->first);
        return result;
    }

    template<typename K, typename V>
    static vec<V> values(const sp<map<K,V>>& map) {
        vec<V> result = make_shared<vector<V>>();
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
