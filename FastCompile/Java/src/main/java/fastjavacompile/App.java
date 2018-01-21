package fastjavacompile;

import java.lang.reflect.*;
import java.io.ByteArrayOutputStream;
import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.util.Scanner;
import java.util.ArrayList;
import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.ToolProvider;
import java.util.Arrays;

public class App
{
    static JavaCompiler javac = ToolProvider.getSystemJavaCompiler();
    static PrintStream originalStdout = new PrintStream(new FileOutputStream(FileDescriptor.out));

    public static String exceptionToString(Throwable e) {
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        String result = sw.toString();
        return result;
    }

    static class CompileHandler implements HttpHandler {
        private class Request {
            public String code;
            public String stdlibCode;
            public String className;
            public String methodName;
        }

        private class Response {
            public long elapsedMs;
            public String exceptionText;
            public String errorCode;
            public Object result;
        }

        public Request getRequest(HttpExchange t) throws IOException {
            InputStream inputStream = t.getRequestBody();
            try {
                Scanner scanner = new Scanner(inputStream).useDelimiter("\\A");
                String requestJson = scanner.hasNext() ? scanner.next() : "";
                Request request = new Gson().fromJson(requestJson, Request.class);
                return request;
            } finally {
                inputStream.close();
            }
        }

        public void sendTextResponse(HttpExchange t, int statusCode, String data) throws IOException {
            t.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            byte[] responseBytes = data.getBytes();
            t.sendResponseHeaders(200, responseBytes.length);
            OutputStream os = t.getResponseBody();
            os.write(responseBytes);
            os.close();
        }

        public void sendResponse(HttpExchange t, Response response) throws IOException {
            String responseJson = new Gson().toJson(response);
            sendTextResponse(t, 200, responseJson);
        }

        @Override
        public void handle(HttpExchange t) throws IOException {
            Response response = new Response();
            
            try {
                String origin = t.getRequestHeaders().getFirst("Origin");
                if (origin == null || (!origin.startsWith("http://127.0.0.1:") && !origin.equals("https://ide.onelang.io"))) {
                    response.exceptionText = "Origin is not allowed: " + origin;
                    response.errorCode = "origin_not_allowed";
                    sendResponse(t, response);
                    return;
                }

                Request request = getRequest(t);

                String[] stdlibParts = request.stdlibCode.split("\nclass ");
                String stdlibImports = stdlibParts[0];

                long startTime = System.nanoTime();

                JavaCompiler javac = ToolProvider.getSystemJavaCompiler();
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
                    Class<?> testClass = cl.loadClass(request.className);
                    Method testMethod = testClass.getMethod(request.methodName, String[].class);
                    testMethod.setAccessible(true);

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    System.setOut(new PrintStream(baos));
                    try {
                        testMethod.invoke(null, new Object[]{ new String[0] });
                    } finally {
                        System.setOut(originalStdout);
                    }
                    response.result = baos.toString();
                    response.elapsedMs = (System.nanoTime() - startTime) / 1000 / 1000;
                }
            } catch(Throwable e) {
                response.exceptionText = exceptionToString(e);
                Log("Exception (handle): " + response.exceptionText);
            }

            sendResponse(t, response);
        }
    }

    public static void Log(String text) {
        System.out.println("[Java] " + text);
    }

    public static void main(String[] args)
    {
        try {
            Log("Started.");

            int port = args.length > 0 ? Integer.parseInt(args[0]) : 8001;
            
            HttpServer server = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), port), 0);
            server.createContext("/compile", new CompileHandler());
            server.start();
            Log("Server listening on port " + port);

            System.in.read();
            server.stop(0);
        } catch(Exception e) {
            Log("Exception (main): " + exceptionToString(e));
        }

        Log("Server stopped.");
    }
}
