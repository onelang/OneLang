class TestClass {
  public testMethod() {
    const str = "a1A";
    for (let i = 0; i < str.length; i++) {
        let c = str[i];
        const is_upper = "A" <= c && c <= "Z";
        const is_lower = "a" <= c && c <= "z";
        const is_number = "0" <= c && c <= "9";
        console.log(is_upper ? "upper" : is_lower ? "lower" : is_number ? "number" : "other");
    }
  }
}

new TestClass().testMethod();