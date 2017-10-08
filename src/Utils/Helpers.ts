export function arrayEq(a, b) {
    if (a === b) return true;
    if (a == null || b == null || a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i)
        if (a[i] !== b[i]) return false;

    return true;
}