#!/usr/bin/env python
import subprocess
import os
import json
import urllib2
import time

import SimpleHTTPServer
from SocketServer import ThreadingMixIn
from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler

PORT = 8000

def log(text):
    print "[Compile] %s" % text

langs = {
    "Java": {
        "port": 8001,
        "cmd": "java -cp target/classes:lib/* fastjavacompile.App {port}",
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
        "port": 8002,
        "cmd": "node index.js {port}",
        "testRequest": {
            "code": '''
                class TestClass {
                    testMethod() {
                        return "{testText}";
                    }
                }
                
                new TestClass().testMethod()''',
        }
    }
}

def postRequest(url, request):
    return urllib2.urlopen(urllib2.Request(url, request)).read()

testText = "Works!"
for langName in langs:
    lang = langs[langName]

    log("Starting %s compiler..." % langName)

    cwd = "%s/FastCompile/%s" % (os.getcwd(), langName)
    args = lang["cmd"].replace("{port}", str(lang["port"])).split(" ")
    lang["subp"] = subprocess.Popen(args, cwd=cwd, stdin=subprocess.PIPE)

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
    def resp(self, statusCode, result):
        self.send_response(statusCode)
        self.end_headers()
        self.wfile.write(json.dumps(result))

    def do_GET(self):
        return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path == '/check':
            try:
                self.resp(200, {'status': 'ok', 'check_res': "result"});
            except Exception as e:
                print e
                self.resp(400, {'status': 'exception'});
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

    log("Send stop signal to %s compiler" % langName)
    lang["subp"].communicate("\n")
    log("Waiting for %s compiler to stop..." % langName)
    lang["subp"].wait()

log("Exiting...")
