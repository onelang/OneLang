export function arrayEq(a, b) {
    if (a === b) return true;
    if (a == null || b == null || a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i)
        if (a[i] !== b[i]) return false;

    return true;
}

export function extend(dest, src) {
    for (const key of Object.keys(src)) {
        if (Array.isArray(dest[key]))
            dest[key].push(...src[key]);
        else if (typeof dest[key] === "object")
            extend(dest[key], src[key]);
        else
            dest[key] = src[key];
    }
}