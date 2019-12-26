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

class Base64 implements ICustomDecoder {
    decode(src: number[]): number[] {
        var dest: number[] = [];

        // 4 base64 chars => 3 bytes
        for (var i = 0; i < src.length; i += 4) {
            var ch0 = this.decodeChar(src[i]);
            var ch1 = this.decodeChar(src[i + 1]);
            var ch2 = this.decodeChar(src[i + 2]);
            var ch3 = this.decodeChar(src[i + 3]);

            var trinity = (ch0 << 18) + (ch1 << 12) + (ch2 << 6) + (ch3);

            dest.push(trinity >> 16);
            dest.push((trinity >> 8) & 0xff);
            dest.push(trinity & 0xff);
        }

        return dest;
    }

    // decodes one Base64 char into 0..63 number
    decodeChar(ch: number): number {
        var value: number = -1;
        if (ch >= 65 && ch <= 90) {
            // `A-Z` => 0..25
            value = ch - 65;
        } else if (ch >= 97 && ch <= 122) {
            // `a-z` => 26..51
            value = ch - 97 + 26;
        } else if (ch >= 48 && ch <= 57) {
            // `0-9` => 52..61
            value = ch - 48 + 52;
        } else if (ch == 43 || ch == 45) {
            // `+` or `-` => 62
            value = 62;
        } else if (ch == 47 || ch == 95) {
            // `/` or `_` => 63
            value = 63;
        } else if (ch == 61) {
            // `=` => padding
            value = 0;
        } else {
            // we should throw an exception here
        }
        return value;
    }
}

class TestClass {
    testMethod() {
        var src1 = [4, 5, 6];
        var decoder: ICustomDecoder = new XorByte(0xff);
        var dst1 = decoder.decode(src1);
        for (const x of dst1)
            console.log(x);

        console.log("|");

        var src2 = [97, 71, 86, 115, 98, 71, 56, 61];
        var decoder2 = new Base64();
        var dst2 = decoder2.decode(src2);
        for (const x of dst2)
            console.log(x);
    }
}