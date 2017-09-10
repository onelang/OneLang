
class TestClass {
    arrayTest() {
        let arr = [];
        arr.push(1);
        arr.push(2);
        for (const item of arr)
            console.log(item);
    }

    calc() {
        return (1 + 2) * 3;
    }

    methodWithArgs(arg1: number, arg2: number, arg3: number) {
        return arg1 + arg2 + arg3 * this.calc();
    }

    testMethod() {
        return "Hello world!";
    }
}
