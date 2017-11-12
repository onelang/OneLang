class TestClass {
  reverseString(str) {
    let result = "";
    for (let i = str.length - 1; i >= 0; i--) {
        result += str[i];
    }
    return result;
  }
  
  testMethod() {
    console.log(this.reverseString("print value"));
    return "return value";
  }
}



new TestClass().testMethod();