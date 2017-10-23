class TestClass {
    testMethod() {
        const strVal = "str";
        const num = 1337;
        const b = true;
        const result = "before " + strVal + ", num: " + num + ", true: " + b + " after";
        //const result = `before ${str}, num: ${num}, true: ${b} after`;
        console.log(result);
        //console.log(`before ${str}, num: ${num}, true: ${b} after`);
    }
}
