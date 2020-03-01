export class Helpers {
    static extend(dest: Object, src: Object) {
        for (const key of Object.keys(src)) {
            if (Array.isArray(dest[key])) {
                for (const item of src[key])
                    dest[key].push(item);
            }
            else if (typeof dest[key] === "object")
                Helpers.extend(dest[key], src[key]);
            else
                dest[key] = src[key];
        }
    }
}