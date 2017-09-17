class TestClass {
    arrayTest() {
        let arr = [1, 2];
        arr.push(3);
        arr.push(4);
        let arr2 = [1 + 2, false];

        for (const item of arr) {
            console.log(item);
        }

        for (const item of arr)
            console.log(item);

        for (let i = 0; i < arr.length; i++)
            console.log(arr[i]);
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
