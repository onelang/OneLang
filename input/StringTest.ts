class TestClass {
    testMethod(): string {
        var x = "x";
        var y = "y";

        var z = "z";
        z += "Z";
        z += x;

        //var a = "abcdef".substring(1,5);
        
        return z + "|" + x + y + "|";
    }
}
