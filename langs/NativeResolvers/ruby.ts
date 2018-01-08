class RubyArray<T> {
    _one: OneArray<T>;

    get(index: number) {
        return this._one.get(index);
    }

    set(index: number, value: T) {
        return this._one.set(index, value);
    }
}

class RubyMap<K,V> {
    _one: OneMap<K,V>;

    get(key: K) {
        this._one.get(key);
    }

    set(key: K, value: V) {
        this._one.set(key, value);
    }
}

class RubyString {
    _one: OneString;

    get(idx: number): OneCharacter {
        return this._one.get(idx);
    }
}

class RubyNumber {
    _one: OneNumber;
}
