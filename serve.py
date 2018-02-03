#!/usr/bin/env python
import os
import subprocess
import sys
from SimpleHTTPServer import SimpleHTTPRequestHandler
from SocketServer import ThreadingMixIn
from BaseHTTPServer import HTTPServer

PORT = 8000

def log(text):
    print "[StaticServe] %s" % text

compilerBackend = None
if not "--withoutCompilerBackend" in sys.argv:
    compilerBackend = subprocess.Popen("python compiler_backend.py --localOnly".split(" "), cwd="CompilerBackend")
    
log("Starting onelang.io static page server... Please use 127.0.0.1:%d on Windows (using 'localhost' makes 1sec delay)" % PORT)

class HTTPHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        SimpleHTTPRequestHandler.end_headers(self)

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    """Handle requests in a separate thread."""

log("Press Ctrl+C to exit.")

try:
    ThreadedHTTPServer(("127.0.0.1", PORT), HTTPHandler).serve_forever()
except KeyboardInterrupt:
    pass

if compilerBackend:
    log("Stopping CompilerBackend...")
    compilerBackend.communicate()

log("Exiting...")