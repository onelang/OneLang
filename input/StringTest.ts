class TestClass {
    testMethod(): string {
        var x = "x";
        var y = "y";

        var z = "z";
        z += "Z";
        z += x;
        
        return z + "|" + x + y;
    }
}
