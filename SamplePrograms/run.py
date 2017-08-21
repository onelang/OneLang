#!/usr/bin/env python
import subprocess
import time
import threading
import os
import sys

cmds = {
  "javascript": "node {name}.js",
  "java": "javac {name}.java && java {name} && rm *.class",
  "python": "python {name}.py",
  "php": "php {name}.php",
  "ruby": "ruby {name}.rb",
  "cpp": "g++ {name}.cpp -o {name} && ./{name} && rm {name}",
  "go": "go run {name}.go",
  "csharp": "mcs {name}.cs && mono {name}.exe && rm {name}.exe",
  "perl": "perl {name}.pl",
  "swift": "swift {name}.swift",
  "typescript": "tsc {name}.ts --outFile {name}.ts.js && node {name}.ts.js && rm {name}.ts.js",
}

prgName = sys.argv[1]
#langsToRun = sys.argv[2].split(',') if len(sys.argv) > 2 else cmds.keys()
langsToRun = cmds.keys()

os.chdir(prgName)

results = []
def execLang(lang, cmd):
    start = time.time()
    try:
        response = subprocess.check_output(cmd.format(name=prgName), shell=True).replace("\n", "\\n")
    except Exception as e:
        response = "Error: %r" % e
    elapsedMs = (time.time() - start) * 1000
    results.append((lang, response, elapsedMs),)

def runMultithreaded():
    threads = []
    for lang in langsToRun:
        t = threading.Thread(target=execLang, args=(lang, cmds[lang]))
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()

def runSequentially():
    for lang in langsToRun:
        execLang(lang, cmds[lang])

gstart = time.time()
if "--single" in sys.argv:
    runSequentially()
else:
    runMultithreaded()
gelapsedMs = (time.time() - gstart) * 1000

print "elapsed: %dms" % gelapsedMs
for (lang, response, elapsedMs) in results:
    print "%s: '%s' (%dms)" % (lang, response, elapsedMs)
