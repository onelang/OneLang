class TestClass {
  testMethod() {
    const str = "ABCDEF";
    const tA0True = str.startsWith("A", 0);
    const tA1False = str.startsWith("A", 1);
    const tB1True = str.startsWith("B", 1);
    const tCD2True = str.startsWith("CD", 2);
    console.log(`${tA0True} ${tA1False} ${tB1True} ${tCD2True}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}