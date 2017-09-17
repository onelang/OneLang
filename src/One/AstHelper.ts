export class AstHelper {
    static replaceProperties<T>(dest, src: T): T {
        for (var i in dest) 
            delete dest[i];

        for (var i of Object.keys(src)) 
            dest[i] = src[i];

        return dest;
    }
}
