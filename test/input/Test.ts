class TestClass {
    mapTest(): number {
        let mapObj = { x: 5, y: 3 };

        //let containsX = "x" in mapObj;
        mapObj["z"] = 9;
        delete mapObj["x"];

        let keysVar = Object.keys(mapObj);
        let valuesVar = Object.values(mapObj);
        return mapObj["z"];
    }

    explicitTypeTest() {
        let op: string = "";
        console.log(op.length);
    }

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

    arrayTest() {
        //const c2 = new Class2();

        let mutableArr = [1, 2];
        mutableArr.push(3);
        mutableArr.push(4);
        // mutableArr.push(c2.property);
        // mutableArr.push(c2.child.property);
        // mutableArr.push(c2.child.child.property);

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

    calc(): number {
        return (1 + 2) * 3;
    }

    methodWithArgs(arg1: number, arg2: number, arg3: number): number {
        const stuff = arg1 + arg2 + arg3 * this.calc();
        return stuff;
    }
    
    stringTest(): string {
        var x = "x";
        var y = "y";

        var z = "z";
        z += "Z";
        z += x;
        
        return z + "|" + x + y;
    }

    reverseString(str: string): string {
        let result = "";
        for (let i = str.length - 1; i >= 0; i--)
            result += str[i];
        return result;
    }

    /*reverseString2(str: string): string {
        let result = "";
        for (const c of str)
            result += c;
        return result;
    }*/

    getBoolResult(value: boolean): boolean { return value; }

    testMethod() {
        this.arrayTest();
        console.log(this.mapTest());
        console.log(this.stringTest());
        console.log(this.reverseString("print value"));
        console.log(this.getBoolResult(true) ? "true" : "false");
    }
}

// class Class2 {
//     property = 5;
//     child: Class2;
// }
