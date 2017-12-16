class TestClass {
  public testMethod() {
    const constant_arr = [5];
    
    const mutable_arr = [1];
    mutable_arr.push(2);
    
    console.log(`len1: ${constant_arr.length}, len2: ${mutable_arr.length}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}