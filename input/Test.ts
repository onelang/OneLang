
class TestClass {
    calc() {
        return (1 + 2) * 3;
    }

    methodWithArgs(arg1: number, arg2: number, arg3: number) {
        return arg1 + arg2 + arg3 * this.calc();
    }

    testMethod() {
        StdLib.Console.print("Hello world!");
    }
}
