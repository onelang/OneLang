class CsArray<T> {
    _one: OneArray<T>;

    get Count(): number { return this._one.length; }

    Add(item: T) {
        this._one.add(item);
    }

    get(index: number): T {
        return this._one.get(index);
    }

    set(index: number, value: T) {
        return this._one.set(index, value);
    }
}

class CsMap<K,V> {
    _one: OneMap<K,V>;

    get(key: K): V {
        return this._one.get(key);
    }

    set(key: K, value: V) {
        this._one.set(key, value);
    }

    get Keys(): OneArray<K> {
        return this._one.keys();
    }    

    get Values(): OneArray<V> {
        return this._one.values();
    }    

    Remove(key: K) {
        this._one.remove(key);
    }
}

class CsString {
    _one: OneString;
    
    get Length(): OneNumber {
        return this._one.length;
    }

    get(idx: number): OneCharacter {
        return this._one.get(idx);
    }
    
    Substring(start: number, length: number): OneString {
        return this._one.substring(start, start + length);
    }

    Split(separator: string): OneArray<OneString> {
        return this._one.split(separator);
    }

    Replace(from: string, to: string): OneString { return this._one.replace(from, to); }
}

class CsNumber {
    _one: OneNumber;
}

class List<T> {
    _one: OneArray<T>;

    get Count(): OneNumber { return this._one.length; }

    Add(item: T) { this._one.add(item); }
    ToArray(): OneArray<T> { return this._one; }
    get(idx: number): T { return this._one.get(idx); }
}

class BigInteger {
    _one: OneBigInteger;
}

class String {
    _one: OneString;

    get Length(): OneNumber { return this._one.length; }
    Replace(from: string, to: string): OneString { return this._one.replace(from, to); }
}

class Console {
    static WriteLine(data: any) {
        OneConsole.print(data);
    }
}
