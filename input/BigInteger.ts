class MathUtils {
    static calc(n: number): number {
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result = result * i;
            if (result > 10)
                result = result >> 2;
        }
        return result;
    }

    static calcBig(n: number): OneBigInteger {
        let result = OneBigInteger.fromInt(1);
        for (let i = 2; i <= n; i++) {
            result = result * i + 123;
            result = result + result;
            if (result > 10)
                result = result >> 2;
        }
        return result;
    }
}

console.log(`5 -> ${MathUtils.calc(5)}, 24 -> ${MathUtils.calcBig(24)}`);
