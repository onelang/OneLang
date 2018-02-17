class PhpArray<T> {
    _one: OneArray<T>;
    
    get length(): OneNumber { return this._one.length; }
    add(item: T): void { this._one.add(item); }
}

class PhpMap<K,V> {
    _one: OneMap<K,V>;
}

class PhpString {
    _one: OneString;
}

class PhpBoolean {
    _one: OneBoolean;
}

class PhpNumber {
    _one: OneNumber;
}