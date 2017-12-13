class TestClass {
  public notThrows() {
    return 5;
  }
  
  public fThrows() {
    throw new Error("exception message");
  }
  
  public testMethod() {
    console.log(this.notThrows());
    this.fThrows();
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}