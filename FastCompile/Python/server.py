#!/usr/bin/env python
import json
import traceback
import time
import sys
import threading
import imp
from cStringIO import StringIO

from SocketServer import ThreadingMixIn
from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler

PORT = 8004

def log(text):
    print "[Python] %s" % text

class HTTPHandler(BaseHTTPRequestHandler):
    def __init__(self, request, client_address, server):
        self.lock = threading.Lock()
        BaseHTTPRequestHandler.__init__(self, request, client_address, server)

    def log_message(self, format, *args):
        pass

    def resp(self, statusCode, result):
        result["backendVersion"] = "one:python:server:20180122"
        responseBody = json.dumps(result)
        self.send_response(statusCode)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", "%d" % len(responseBody))
        self.end_headers()
        self.wfile.write(responseBody)
        self.wfile.close()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store")
        BaseHTTPRequestHandler.end_headers(self)

    def do_POST(self):
        try:
            origin = self.headers.getheader('origin') or "<null>"
            if origin != "https://ide.onelang.io" and not origin.startswith("http://127.0.0.1:"):
                self.resp(403, { "exceptionText": "Origin is not allowed: " + origin, "errorCode": "origin_not_allowed" })
                return

            if self.path == '/compile':
                fn = None
                request = json.loads(self.rfile.read(int(self.headers.getheader('content-length'))))

                with self.lock:
                    elapsedMs = None
                    original_stdout = sys.stdout
                    sys.stdout = result_stdout = StringIO()
                    try:
                        start = time.time()

                        sys.modules['one'] = imp.new_module('one')
                        exec(request["stdlibCode"], sys.modules['one'].__dict__)
                        exec(request["code"], {})
                        elapsedMs = int((time.time() - start) * 1000)
                    finally:
                        sys.stdout = original_stdout

                self.resp(200, { "result": result_stdout.getvalue(), "elapsedMs": elapsedMs })
            else:
                self.resp(404, { "error": "unknown method" })
        except Exception as e:
            #log(repr(e))
            self.resp(400, { 'exceptionText': traceback.format_exc() })

log("server is listening on port %d" % PORT)

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer): 
    daemon_threads = True 
    """Handle requests in a separate thread.""" 

try:
    ThreadedHTTPServer(("127.0.0.1", PORT), HTTPHandler).serve_forever()
except KeyboardInterrupt:
    pass