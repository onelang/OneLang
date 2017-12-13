class TestClass {
  notThrows() {
    return 5;
  }
  
  fThrows() {
    throw new Error("exception message");
  }
  
  testMethod() {
    console.log(this.notThrows());
    this.fThrows();
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}