class TestClass {
  testMethod() {
    const strVal = "str";
    const num = 1337;
    const b = true;
    const result = `before ${strVal}, num: ${num}, true: ${b} after`;
    console.log(result);
    console.log(`before ${strVal}, num: ${num}, true: ${b} after`);
    
    const result2 = "before " + strVal + ", num: " + num + ", true: " + b + " after";
    console.log(result2);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}