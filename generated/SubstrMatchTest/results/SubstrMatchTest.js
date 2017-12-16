class TestClass {
  testMethod() {
    const str = "ABCDEF";
    const t_a0_true = str.startsWith("A", 0);
    const t_a1_false = str.startsWith("A", 1);
    const t_b1_true = str.startsWith("B", 1);
    const t_c_d2_true = str.startsWith("CD", 2);
    console.log(`${t_a0_true} ${t_a1_false} ${t_b1_true} ${t_c_d2_true}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}