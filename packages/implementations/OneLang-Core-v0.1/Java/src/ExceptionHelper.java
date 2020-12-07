package io.onelang.std.core;

import java.io.StringWriter;
import java.io.PrintWriter;

public class ExceptionHelper {
    public static String toString(Exception e) {
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }
}

