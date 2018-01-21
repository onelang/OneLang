#!/usr/bin/env python
import json
import traceback
import sys
import imp
from cStringIO import StringIO

while True:
    try:
        requestLine = raw_input()
    except:
        break

    try:
        request = json.loads(requestLine)
        if request["cmd"] == "compile":
            original_stdout = sys.stdout
            sys.stdout = result_stdout = StringIO()
            try:
                sys.modules["one"] = imp.new_module("one")
                exec(request["stdlibCode"], sys.modules["one"].__dict__)
                exec(request["code"], {})
            finally:
                sys.stdout = original_stdout

            print json.dumps({ "result": result_stdout.getvalue() })
        else:
            print json.dumps({ "errorCode": "unknown_command", "exceptionText": "Unknown command: " + request["cmd"] })
    except Exception as e:
        print json.dumps({ "errorCode": "unexpected_exception", "exceptionText": traceback.format_exc() })
