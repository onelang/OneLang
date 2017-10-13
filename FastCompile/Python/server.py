#!/usr/bin/env python
import json
import traceback
import time

import SimpleHTTPServer
from SocketServer import ThreadingMixIn
from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler

PORT = 8004

def log(text):
    print "[Python] %s" % text

class HTTPHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def resp(self, statusCode, result):
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

    def do_GET(self):
        return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path == '/compile':
            fn = None
            try:
                request = json.loads(self.rfile.read(int(self.headers.getheader('content-length'))))
                #for key in request.keys()
                code = request["code"] + "\n" + "result = %s().%s()" % (request["className"], request["methodName"])
                #print code
                start = time.time()
                result = None
                exec(code)
                elapsedMs = int((time.time() - start) * 1000)
                self.resp(200, { 'result': result, "elapsedMs": elapsedMs })
            except Exception as e:
                #log(repr(e))
                self.resp(400, { 'exceptionText': traceback.format_exc() })
        else:
            return SimpleHTTPServer.SimpleHTTPRequestHandler.do_POST(self) 

log("server is listening on port %d" % PORT)

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    """Handle requests in a separate thread."""

try:
    ThreadedHTTPServer(("127.0.0.1", PORT), HTTPHandler).serve_forever()
except KeyboardInterrupt:
    pass