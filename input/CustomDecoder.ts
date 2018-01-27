interface ICustomDecoder {
    decode(src: number[]): number[];
}

class XorByte implements ICustomDecoder {
    constructor(public xorValue: number) {}

    decode(src: number[]): number[] {
        var dest: number[] = [];

        for (var i = 0; i < src.length; i++) {
            dest.push(src[i] ^ this.xorValue);
        }

        return dest;
    }
}

class TestClass {
    testMethod() {
        var a = [4, 5, 6];
        var decoder: ICustomDecoder = new XorByte(0xff);
        var b = decoder.decode(a);
        for (const x of b)
            console.log(x);
    }
}