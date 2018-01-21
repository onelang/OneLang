import json
import subprocess
import sys
import time

class Client:
    def __init__(self, cmd, cwd):
        self.p = subprocess.Popen(cmd.split(" "), stdin=subprocess.PIPE, stdout=subprocess.PIPE, bufsize=1, universal_newlines=True, cwd=cwd)
    
    def request(self, request):
        self.p.stdin.write(json.dumps(request) + "\n")
        return json.loads(self.p.stdout.readline())

    def compile(self, code, stdlib):
        return self.request({"cmd": "compile", "code": code, "stdlibCode": stdlib, "className": "TestClass", "methodName": "testMethod" })

#python = Client("python -u Python/jsonrepl.py")
#for i in range(2):
#    print "python = %r" % python.compile("print 'hello world %d'" % i, "")

#php = Client("php PHP/jsonrepl.php")
#php.compile("print 'hello world';", "")

#ruby = Client("ruby Ruby/jsonrepl.rb")
#print "Ruby = %r" % ruby.compile("puts 'hello world';", "")

#tsjs = Client("node TypeScript/jsonrepl.js")
#print "TS/JS = %r" % tsjs.compile("console.log('hello world');", "")

java = Client("java -cp target/classes:lib/* fastjavacompile.App", "Java")
print "java = %r" % java.compile('''
                class Program {
                    public static void main(String[] args) {
                        System.out.println("hello world!");
                    }
                }''', "")

#for i in range(2):
#    print "php = %r" % php.compile("print 'hello world %d';" % i, "")

start = time.time()
for i in range(1):
   java.compile('''
                class Program {
                    public static void main(String[] args) {
                        System.out.println("hello %d!");
                    }
                }''' % i, "")
elapsedMs = int((time.time() - start) * 1000)
print "done: %dms" % elapsedMs
