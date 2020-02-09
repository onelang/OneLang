class TestClass {
    testMethod() {
        const str = "ABCDEF";
        const tA0_true = str.startsWith("A", 0);
        const tA1_false = str.startsWith("A", 1);
        const tB1_true = str.startsWith("B", 1);
        const tCD2_true = str.startsWith("CD", 2);
        console.log(`${tA0_true} ${tA1_false} ${tB1_true} ${tCD2_true}`);
    }
}