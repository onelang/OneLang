#!/usr/bin/env python
import subprocess
import os
import json
import urllib2
import time
import datetime
import traceback
import shutil
import errno
import sys

import SimpleHTTPServer
from SocketServer import ThreadingMixIn
from BaseHTTPServer import HTTPServer

PORT = 8000
TEST_SERVERS = False
TMP_DIR = "tmp/compilation/"

def log(text):
    print "[Compile] %s" % text

langs = {
    "Java": { # uses in-memory compilation
        "jsonReplCmd": "java -cp target/classes:lib/* fastjavacompile.App",
        "testCode": '''
            class Program {
                public static void main(String[] args) {
                    System.out.println("hello world!");
                }
            }
        ''',
        "mainFn": "Program.java",
        "stdlibFn": "one.java",
        "cmd": "javac Program.java one.java && java Program",
        "versionCmd": "javac -version; java -version",
    },
    "TypeScript": { # uses in-memory compilation
        "jsonReplCmd": "../../node_modules/node/bin/node jsonrepl.js",
        "testCode": "console.log('hello world!');",
        "cmd": "tsc index.ts node_modules/one/index.ts > /dev/null; node index.js",
        "mainFn": "index.ts",
        "stdlibFn": "node_modules/one/index.ts",
        "versionCmd": "echo Node: `node -v`; echo TSC: `tsc -v`",
    },
    "JavaScript": { # uses in-memory compilation
        "jsonReplCmd": "../../node_modules/node/bin/node jsonrepl.js",
        "jsonReplDir": "TypeScript",
        "testCode": "console.log('hello world!');",
        "cmd": "node index.js",
        "mainFn": "index.js",
        "stdlibFn": "node_modules/one/index.js",
        "versionCmd": "echo Node: `node -v`",
    },
    "Python": { # uses in-memory compilation
        "jsonReplCmd": "python -u jsonrepl.py",
        "testCode": "print 'hello world!'",
        "mainFn": "main.py",
        "stdlibFn": "one.py",
        "cmd": "python main.py",
        "versionCmd": "python --version",
    },
    "Ruby": { # uses in-memory compilation
        "jsonReplCmd": "ruby jsonrepl.rb",
        "testCode": "puts 'hello world!'",
        "mainFn": "main.rb",
        "stdlibFn": "one.rb",
        "cmd": "ruby -I. main.rb",
        "versionCmd": "ruby -v",
    },
    "CSharp": { # uses in-memory compilation
        "jsonReplCmd": "dotnet run --no-build",
        "testCode": """
            using System;
            public class Program
            {
                public static void Main(string[] args)
                {
                    Console.WriteLine("Hello World!");
                }
            }
        """,
        "cmd": "csc Program.cs StdLib.cs > /dev/null && ./Program.exe",
        "mainFn": "Program.cs",
        "stdlibFn": "StdLib.cs",
        "versionCmd": "dotnet --info; echo CSC version: `csc -version`",
    },
    "PHP": { # uses in-memory compilation
        "serverCmd": "php -S 127.0.0.1:{port} server.php",
        "port": 8003,
        "testCode": "print 'hello world!';",
        "mainFn": "main.php",
        "stdlibFn": "one.php",
        "cmd": "php main.php",
        "versionCmd": "php -v",
    },
    "CPP": {
        "ext": "cpp",
        "mainFn": "main.cpp",
        "stdlibFn": "one.hpp",
        "cmd": "g++ -std=c++17 main.cpp -I. -o binary && ./binary",
        "versionCmd": "g++ -v",
    },
    "Go": {
        "ext": "go",
        "mainFn": "main.go",
        "stdlibFn": "src/one/one.go",
        "cmd": "GOPATH=$PWD go run main.go",
        "versionCmd": "go version",
    },
    "Perl": {
        "ext": "pl",
        "mainFn": "main.pl",
        "stdlibFn": "one.pm",
        "cmd": "perl -I. main.pl",
        "versionCmd": "perl -v",
    },
    "Swift": {
        "ext": "swift",
        "mainFn": "main.swift",
        "stdlibFn": "one.swift",
        "cmd": "cat one.swift main.swift | swift -",
        "versionCmd": "swift --version",
    }
}

class JsonReplClient:
    def __init__(self, cmd, cwd):
        self.p = subprocess.Popen(cmd.split(" "), stdin=subprocess.PIPE, stdout=subprocess.PIPE, bufsize=1, universal_newlines=True, cwd=cwd)
    
    def request(self, request):
        self.p.stdin.write(json.dumps(request) + "\n")
        return json.loads(self.p.stdout.readline())

    def compile(self, code, stdlib):
        return self.request({"cmd": "compile", "code": code, "stdlibCode": stdlib, "className": "TestClass", "methodName": "testMethod" })

def postRequest(url, request):
    return urllib2.urlopen(urllib2.Request(url, request, headers={"Origin": "http://127.0.0.1:8000"})).read()

def mkdir_p(path):
    try:
        os.makedirs(path)
    except OSError as exc:  # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else:
            raise    

def providePath(fileName):
    mkdir_p(os.path.dirname(fileName))
    return fileName

mkdir_p(TMP_DIR)

if not "--no-in-memory-compilation" in sys.argv:
    for langName in langs:
        try:
            lang = langs[langName]
            cwd = "%s/FastCompile/%s" % (os.getcwd(), lang.get("jsonReplDir", langName))
            if "jsonReplCmd" in lang:
                log("Starting %s JSON-REPL..." % langName)
                lang["jsonRepl"] = JsonReplClient(lang["jsonReplCmd"], cwd)
            elif "serverCmd" in lang:
                log("Starting %s HTTP server..." % langName)
                args = lang["serverCmd"].replace("{port}", str(lang["port"])).split(" ") 
                lang["server"] = subprocess.Popen(args, cwd=cwd, stdin=subprocess.PIPE) 
        except Exception as e:
            print "Failed to start compiler %s: %r" % (langName, e)

if TEST_SERVERS: # TODO
    testText = "Works!"
    requestJson = json.dumps(lang["testRequest"], indent=4).replace("{testText}", testText)

    maxTries = 10
    for i in xrange(maxTries):
        try:
            time.sleep(0.1 * (i + 1))
            log("  Checking %s compiler's status (%d / %d)..." % (langName, i + 1, maxTries))
            responseJson = postRequest("http://127.0.0.1:%d/compile" % lang["port"], requestJson)
            break
        except:
            pass

    response = json.loads(responseJson)
    log("  %s compiler's test response: %s" % (langName, response))
    if response["result"] != testText:
        log("Invalid response. Compiler will be disabled.")
    else:
        log("%s compiler is ready!" % langName)        

version_cache = None

class HTTPHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def resp(self, statusCode, result):
        result["controllerVersion"] = "one:v1:20180122"
        responseBody = json.dumps(result)
        self.send_response(statusCode)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", "%d" % len(responseBody))
        self.end_headers()
        self.wfile.write(responseBody)
        self.wfile.close()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store")
        SimpleHTTPServer.SimpleHTTPRequestHandler.end_headers(self)

    def compile(self):
        requestJson = self.rfile.read(int(self.headers.getheader('content-length')))
        request = json.loads(requestJson)
        request["cmd"] = "compile"
        langName = request["lang"]
        lang = langs[langName]

        if "jsonRepl" in lang:
            start = time.time()
            response = lang["jsonRepl"].request(request)
            response["elapsedMs"] = int((time.time() - start) * 1000)
            self.resp(200, response)
        elif "server" in lang:
            start = time.time()
            responseJson = postRequest("http://127.0.0.1:%d" % lang["port"], requestJson)
            response = json.loads(responseJson)
            response["elapsedMs"] = int((time.time() - start) * 1000)
            self.resp(200, response)
        else:
            dateStr = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            outDir = "%s%s_%s/" % (TMP_DIR, dateStr, langName)

            with open(providePath(outDir + lang["mainFn"]), "wt") as f: f.write(request["code"])
            with open(providePath(outDir + lang["stdlibFn"]), "wt") as f: f.write(request["stdlibCode"])
            
            start = time.time()
            pipes = subprocess.Popen(lang["cmd"], shell=True, cwd=outDir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = pipes.communicate()

            if pipes.returncode != 0 or len(stderr) > 0:
                self.resp(400, { "result": stdout, "exceptionText": stderr })
            else:
                elapsedMs = int((time.time() - start) * 1000)
                shutil.rmtree(outDir)
                self.resp(200, { "result": stdout, "elapsedMs": elapsedMs })

    def compiler_versions(self):
        # TODO: thread-safety
        global version_cache
        if not version_cache:
            version_cache = {}
            for lang in langs:
                try:
                    version_cache[lang] = subprocess.check_output(langs[lang]["versionCmd"], shell=True, stderr=subprocess.STDOUT)
                except subprocess.CalledProcessError as e:
                    version_cache[lang] = e.output
        self.resp(200, version_cache)

    def apiCall(self):
        method = None
        if self.command == "GET" and self.path == '/compiler_versions':
            method = self.compiler_versions
        elif self.command == "POST" and self.path == '/compile':
            method = self.compile

        if not method:
            return False

        origin = self.headers.getheader('origin') or "<null>"
        if origin != "https://ide.onelang.io" and not origin.startswith("http://127.0.0.1:"):
            self.resp(403, { "exceptionText": "Origin is not allowed: " + origin, "errorCode": "origin_not_allowed" })
            return

        try:
            method()
        except Exception as e:
            log(repr(e))
            self.resp(400, { 'exceptionText': traceback.format_exc() })

        return True

    def do_GET(self):
        if not self.apiCall():
            return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if not self.apiCall():
            self.resp(403, { "exceptionText": "API endpoint was not found: " + self.path, "errorCode": "endpoint_not_found" })

log("Starting HTTP server... Please use 127.0.0.1:%d on Windows (using 'localhost' makes 1sec delay)" % PORT)

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    """Handle requests in a separate thread."""

log("Press Ctrl+C to exit.")

try:
    ThreadedHTTPServer(("127.0.0.1", PORT), HTTPHandler).serve_forever()
except KeyboardInterrupt:
    pass

for langName in langs:
    lang = langs[langName]
    if not "subp" in lang: continue

    log("Send stop signal to %s compiler" % langName)
    lang["subp"].communicate("\n")
    log("Waiting for %s compiler to stop..." % langName)
    lang["subp"].wait()

log("Exiting...")
