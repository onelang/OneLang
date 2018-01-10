class RubyArray<T> {
    _one: OneArray<T>;

    get length(): number { return this._one.length; }

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

    keys(): K[] { return this._one.keys(); }
    values(): V[] { return this._one.values(); }
}

class RubyString {
    _one: OneString;

    get length(): OneNumber { return this._one.length; }

    get(idx: number): OneCharacter {
        return this._one.get(idx);
    }
}

class RubyNumber {
    _one: OneNumber;
}

class IO {
    static read(filename: string): OneString {
        return OneFile.readText(filename);
    }
}