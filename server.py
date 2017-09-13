#!/usr/bin/env python
import subprocess
import os
import json
import urllib2
import time
import datetime
import traceback

import SimpleHTTPServer
from SocketServer import ThreadingMixIn
from BaseHTTPServer import HTTPServer

PORT = 8000
TEST_SERVERS = False
TMP_DIR = "tmp/FastCompile/"

def log(text):
    print "[Compile] %s" % text

langs = {
    "Java": {
        "ext": "java",
        "cmd": "javac {name}.java && java {name} && rm {name}.class",
        "serverCmd": "java -cp target/classes:lib/* fastjavacompile.App {port}",
        "port": 8001,
        "testRequest": {
            "code": '''
                public class TestClass {
                    public String testMethod() {
                        return "{testText}";
                    }
                }''',
            "className": 'TestClass',
            "methodName": 'testMethod'
        }
    },
    "JavaScript": {
        "ext": "js",
        "cmd": "node {name}.js",
    },
    "Python": {
        "ext": "py",
        "cmd": "python {name}.py",
        "serverCmd": "python server.py",
        "port": 8004,
    },
    "PHP": {
        "ext": "php",
        "cmd": "php {name}.php",
        "serverCmd": "php -S 127.0.0.1:8003 server.php",
        "port": 8003,
    },
    "Ruby": {
        "ext": "rb",
        "cmd": "ruby {name}.rb",
        "serverCmd": "ruby server.rb",
        "port": 8005,
    },
    "CPP": {
        "ext": "cpp",
        "cmd": "g++ {name}.cpp -o {name} && ./{name} && rm {name}"
    },
    "Go": {
        "ext": "go",
        "cmd": "go run {name}.go"
    },
    "CSharp": {
        "ext": "cs",
        "cmd": "mcs {name}.cs && mono {name}.exe && rm {name}.exe"
    },
    "Perl": {
        "ext": "pl",
        "cmd": "perl {name}.pl"
    },
    "Swift": {
        "ext": "swift",
        "cmd": "swift {name}.swift"
    },
    "TypeScript": {
        "ext": "ts",
        "cmd": "tsc {name}.ts --outFile {name}.ts.js && node {name}.ts.js && rm {name}.ts.js",
        "serverCmd": "../../node_modules/node/bin/node index.js {port}",
        "port": 8002,
        "testRequest": {
            "code": '''
                class TestClass {
                    testMethod(): void {
                        return "{testText}";
                    }
                }
                
                new TestClass().testMethod()''',
        }
    },
}

def postRequest(url, request):
    return urllib2.urlopen(urllib2.Request(url, request)).read()

if not os.path.isdir("tmp"): os.mkdir("tmp")
if not os.path.isdir("tmp/FastCompile"): os.mkdir("tmp/FastCompile")

testText = "Works!"
for langName in langs:
    lang = langs[langName]
    if not "serverCmd" in lang: continue

    log("Starting %s compiler..." % langName)

    cwd = "%s/FastCompile/%s" % (os.getcwd(), langName)
    args = lang["serverCmd"].replace("{port}", str(lang["port"])).split(" ")
    lang["subp"] = subprocess.Popen(args, cwd=cwd, stdin=subprocess.PIPE)

    if TEST_SERVERS:
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

class HTTPHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def resp(self, statusCode, result):
        responseBody = json.dumps(result)
        self.send_response(statusCode)
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:8000")
        self.send_header("Content-Length", "%d" % len(responseBody))
        self.end_headers()
        self.wfile.write(responseBody)
        self.wfile.close()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store")
        SimpleHTTPServer.SimpleHTTPRequestHandler.end_headers(self)

    def do_GET(self):
        return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path == '/compile':
            fn = None
            try:
                request = json.loads(self.rfile.read(int(self.headers.getheader('content-length'))))
                lang = langs[request["lang"]]

                name = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                fn = "%s%s.%s" % (TMP_DIR, name, lang["ext"])
                with open(fn, "wt") as f: f.write(request["code"])
                
                start = time.time()
                pipes = subprocess.Popen(lang["cmd"].format(name=name), shell=True, cwd=TMP_DIR, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                stdout, stderr = pipes.communicate()

                if pipes.returncode != 0 or len(stderr) > 0:
                    self.resp(400, { 'exceptionText': stderr })
                else:
                    elapsedMs = int((time.time() - start) * 1000)
                    os.remove(fn)
                    self.resp(200, { 'result': stdout, "elapsedMs": elapsedMs })
            except Exception as e:
                log(repr(e))
                self.resp(400, { 'exceptionText': traceback.format_exc() })
        else:
            return SimpleHTTPServer.SimpleHTTPRequestHandler.do_POST(self) 

log("Starting HTTP server... Please use 127.0.0.1:%d on Windows (using 'localhost' makes 1sec delay)" % PORT)

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    """Handle requests in a separate thread."""

log("Press Ctrl+C to exit.")

try:
    ThreadedHTTPServer(("", PORT), HTTPHandler).serve_forever()
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
