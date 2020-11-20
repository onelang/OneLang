using System;

public class Error : Exception {
    public Error() { }
    public Error(string msg): base(msg) { }
    public static int stackTraceLimit = 0;
    public string stack;
}
