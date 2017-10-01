class Class2 {
    property = 5;
    child: Class2;
}

class TestClass {
    arrayTest() {
        const c2 = new Class2();

        let mutableArr = [1, 2];
        mutableArr.push(3);
        mutableArr.push(4);
        mutableArr.push(c2.property);
        mutableArr.push(c2.child.property);
        mutableArr.push(c2.child.child.property);

        let constantArr = [5, 6];

        // some comment
        for (const item of mutableArr) {
            console.log(item);
        }

        /* some other comment
           multiline and stuff
        */
        for (let i = 0; i < constantArr.length; i++)
            console.log(constantArr[i]);
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
