package io.onelang.std.core;

import java.util.function.BiFunction;
import java.util.List;
import java.util.ArrayList;

public class StdArrayHelper {
    public static <T> Boolean allMatch(T[] items, BiFunction<T, Integer, Boolean> predicate) {
        int idx = 0;
        for (T item : items)
            if (!predicate.apply(item, idx++))
                return false;
        return true;
    }

    public static <T> Boolean allMatch(List<T> items, BiFunction<T, Integer, Boolean> predicate) {
        int idx = 0;
        for (T item : items)
            if (!predicate.apply(item, idx++))
                return false;
        return true;
    }
}