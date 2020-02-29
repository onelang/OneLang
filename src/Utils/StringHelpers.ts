export class StringHelpers {
    static ucFirst(str: String) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    static lcFirst(str: String) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }
}
