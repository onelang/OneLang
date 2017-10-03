class Class2 {
    property = 5;
    child: Class2;
}

class TestClass {
    ifTest(x: number): string {
        let result = "<unk>";

        if (x > 3) {
            result = "hello";
        } else if (x < 1) {
            result = "bello";
        } else if (x < 0) {
            result = "bello2";
        } else {
            result = "???";
        }

        if (x > 3) {
            result = "z";
        }

        if (x > 3) {
            result = "x";
        } else {
            result = "y";
        }

        return result;
    }

    //splitJoinTest() {
    //    const items = "1,2,3".split(",");
    //    const newStr = items.join("_");
    //    return newStr;
    //}

    mapTest() {
        //let map = { x: 5, y: 3 };
        //let containsX = "x" in map;
        //map["z"] = 9;
        //let keys = Object.keys(map);
        //let values = Object.values(map);
    }

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
        //   some comment line 2
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
        return this.ifTest(5);
    }
}
