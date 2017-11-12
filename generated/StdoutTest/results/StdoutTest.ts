class TestClass {
  public reverseString(str: string) {
    let result = "";
    for (let i = str.length - 1; i >= 0; i--) {
        result += str[i];
    }
    return result;
  }
  
  public testMethod() {
    console.log(this.reverseString("print value"));
    return "return value";
  }
}

new TestClass().testMethod();