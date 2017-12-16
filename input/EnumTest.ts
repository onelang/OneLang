enum TestEnum { Item1, Item2 }

class TestClass {
    testMethod() {
        let enumV = TestEnum.Item1;
        if (3 * 2 === 6)
            enumV = TestEnum.Item2;
        console.log(`Item1: ${TestEnum.Item1}, Item2: ${enumV}`);
    }
}