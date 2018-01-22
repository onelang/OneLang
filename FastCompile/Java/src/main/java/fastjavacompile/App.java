package fastjavacompile;

import com.google.gson.Gson;
import java.lang.reflect.*;
import java.io.*;
import java.util.*;
import javax.tools.*;

class Request {
    public String code;
    public String stdlibCode;
    public String className;
    public String methodName;
}

class Response {
    public String exceptionText;
    public String errorCode;
    public Object result;
    public String backendVersion;
}

public class App
{
    public static void main(String[] args) {
        JavaCompiler javac = ToolProvider.getSystemJavaCompiler();
        PrintStream originalStdout = new PrintStream(new FileOutputStream(FileDescriptor.out));

        Scanner stdin = new Scanner(System.in);
        while(stdin.hasNextLine()) {
            Response response = new Response();
            
            try {
                String requestLine = stdin.nextLine();
                Request request = new Gson().fromJson(requestLine, Request.class);

                String[] stdlibParts = request.stdlibCode.split("\nclass ");
                String stdlibImports = stdlibParts[0];

                ArrayList<SourceCode> compilationUnits = new ArrayList<SourceCode>();
                compilationUnits.add(new SourceCode(request.className, request.code));

                for (int iPart = 1; iPart < stdlibParts.length; iPart++) {
                    String stdlibPart = stdlibParts[iPart];
                    int offs;
                    for (offs = 0; offs < stdlibPart.length(); offs++) {
                        char c = stdlibPart.charAt(offs);
                        if (!Character.isLetterOrDigit(c) && c != '_')
                            break;
                    }

                    String name = stdlibPart.substring(0, offs);
                    String content = stdlibPart.substring(offs);
                    compilationUnits.add(new SourceCode(name, 
                        stdlibImports + "\nclass " + name + "\n" + content));
                }

                DynamicClassLoader cl = new DynamicClassLoader(ClassLoader.getSystemClassLoader());
                ExtendedStandardJavaFileManager fileManager = new ExtendedStandardJavaFileManager(
                    javac.getStandardFileManager(null, null, null), cl);
                StringWriter writer = new StringWriter();
                JavaCompiler.CompilationTask task = javac.getTask(writer, fileManager, null, null, null, compilationUnits);
                if (!task.call()) {
                    response.exceptionText = writer.toString();
                } else {
                    Class<?> testClass = cl.loadClass("Program");
                    Method testMethod = testClass.getMethod("main", String[].class);
                    testMethod.setAccessible(true);

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    System.setOut(new PrintStream(baos));
                    try {
                        testMethod.invoke(null, new Object[]{ new String[0] });
                    } finally {
                        System.setOut(originalStdout);
                    }
                    response.result = baos.toString();
                }
            } catch(Throwable e) {
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                response.exceptionText = sw.toString();
            }

            response.backendVersion = "one:java:jsonrepl:20180122";
            String responseJson = new Gson().toJson(response);
            System.out.println(responseJson);
        }
    }
}
