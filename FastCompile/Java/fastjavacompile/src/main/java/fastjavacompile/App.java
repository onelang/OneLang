package fastjavacompile;

import java.lang.reflect.*;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.InetSocketAddress;
import java.util.Scanner;
import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

/**
 * Hello world!
 *
 */
public class App
{
    static class CompileHandler implements HttpHandler {
        private class Request {
            public String code;
            public String className;
            public String methodName;
        }

        private class Response {
            public long elapsedMs;
            public String exceptionText;
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

        public void sendResponse(HttpExchange t, Response response) throws IOException {
            String responseJson = new Gson().toJson(response);
            t.getResponseHeaders().add("Access-Control-Allow-Origin", "http://localhost:8000");
            t.sendResponseHeaders(200, responseJson.length());
            OutputStream os = t.getResponseBody();
            os.write(responseJson.getBytes());
            os.close();
        }

        public String exceptionToString(Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            String result = sw.toString();
            return result;
    }

        @Override
        public void handle(HttpExchange t) throws IOException {
            System.out.println("Before parsing request");
            Request request = getRequest(t);
            System.out.println("After parsing request");

            Response response = new Response();
            long startTime = System.nanoTime();
            
            try {
                System.out.println("Before compile");
                Class<?> helloClass = InMemoryJavaCompiler.compile(request.className, request.code);
                System.out.println("After compile");
                Constructor<?> ctor = helloClass.getConstructor();
                Object instance = ctor.newInstance();
                Method testMethod = helloClass.getMethod(request.methodName);
                System.out.println("Before invoke");
                response.result = testMethod.invoke(instance);
                System.out.println("After invoke");
            } catch(Exception e) {
                response.exceptionText = exceptionToString(e);
            }

            response.elapsedMs = (System.nanoTime() - startTime) / 1000 / 1000;
            System.out.println("Compile: " + response.elapsedMs + "ms");

            sendResponse(t, response);
        }
    }

    public static void main(String[] args)
    {
        try {
            System.out.println("Started.");

            int port = args.length > 0 ? Integer.parseInt(args[0]) : 8001;
            
            HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
            server.createContext("/compile", new CompileHandler());
            server.start();
    
            System.out.println("Server started.");
        } catch(Exception e) {
            System.out.println(e);
        }

        System.out.println("Main done.");
    }
}
