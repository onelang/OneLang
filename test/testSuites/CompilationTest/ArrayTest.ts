class TestClass {
    testMethod() {
        let constantArr = [5];
        
        let mutableArr = [1];
        mutableArr.push(2);

        console.log(`len1: ${constantArr.length}, len2: ${mutableArr.length}`);
    }
}