#!/usr/bin/env python
import json
import traceback
import sys
import imp
from cStringIO import StringIO

def resp(result):
    result["backendVersion"] = "one:python:jsonrepl:20180122"
    print json.dumps(result)

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

            resp({ "result": result_stdout.getvalue() })
        else:
            resp({ "errorCode": "unknown_command", "exceptionText": "Unknown command: " + request["cmd"] })
    except Exception as e:
        resp({ "errorCode": "unexpected_exception", "exceptionText": traceback.format_exc() })
