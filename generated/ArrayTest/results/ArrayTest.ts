class TestClass {
  testMethod() {
    const constantArr = [5];
    
    const mutableArr = [1];
    mutableArr.push(2);
    
    console.log(`len1: ${constantArr.length}, len2: ${mutableArr.length}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}