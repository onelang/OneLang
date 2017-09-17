class Class2 {
    property = 5;
    child: Class2;
}

class TestClass {
    arrayTest() {
        const c2 = new Class2();

        let arr = [1, 2];
        arr.push(3);
        arr.push(4);
        arr.push(c2.property);
        arr.push(c2.child.property);
        arr.push(c2.child.child.property);
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
        const stuff = arg1 + arg2 + arg3 * this.calc();
        return stuff;
    }

    testMethod() {
        return "Hello world!";
    }
}
