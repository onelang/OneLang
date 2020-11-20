using System;

public static class console {
    public static void log(string msg) {
        Console.WriteLine(msg);
    }

    public static void error(string msg) {
        var oldColor = Console.ForegroundColor;
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine(msg);
        Console.ForegroundColor = oldColor;
    }
}
