#pragma once

#include <memory>
#include <vector>
#include <map>
#include <string>
#include <iostream>

namespace one {
    template <typename T>
    using sp = std::shared_ptr<T>;

    template <typename T>
    using vec = one::sp<std::vector<T>>;

    template<class Key, class T>
    std::shared_ptr<std::map<Key,T>> make_shared_map(std::initializer_list<typename std::map<Key,T>::value_type> il)
    {
        return std::make_shared<std::map<Key,T>>(il);
    }
}

class OneMapHelper {
  public:
    template<typename K, typename V>
    static one::vec<K> keys(const one::sp<std::map<K,V>>& map) {
        one::vec<K> result = std::make_shared<std::vector<K>>();
        for(auto it = map->begin(); it != map->end(); ++it)
            result->push_back(it->first);
        return result;
    }

    template<typename K, typename V>
    static one::vec<V> values(const one::sp<std::map<K,V>>& map) {
        one::vec<V> result = std::make_shared<std::vector<V>>();
        for(auto it = map->begin(); it != map->end(); ++it)
            result->push_back(it->second);
        return result;
    }
};

class OneStringHelper {
  public:
    static one::vec<std::string> split(const std::string& str, const std::string& delim)
    {
        one::vec<std::string> tokens(new std::vector<std::string>());
        
        size_t prev = 0, pos = 0;
        do
        {
            pos = str.find(delim, prev);
            if (pos == std::string::npos) pos = str.length();
            std::string token = str.substr(prev, pos - prev);
            tokens->push_back(token);
            prev = pos + delim.length();
        }
        while (pos < str.length() && prev < str.length());

        return tokens;
    }

    static std::string replace(const std::string& str, const std::string& from, const std::string& to) {
        if(from.empty()) return "";

        std::string result = str;
        size_t start_pos = 0;
        while((start_pos = result.find(from, start_pos)) != std::string::npos) {
            result.replace(start_pos, from.length(), to);
            start_pos += to.length(); // In case 'to' contains 'from', like replacing 'x' with 'yx'
        }
        return result;
    }
};
