#!/usr/bin/env python2
import subprocess
import time
import threading

cmds = {
  "javascript": "node HelloWorld.js",
  #"java": "javac HelloWorld.java && java HelloWorld && rm HelloWorld.class",
  "python": "python HelloWorld.py",
  "php": "php HelloWorld.php",
  "ruby": "ruby HelloWorld.rb",
  #"cpp": "g++ HelloWorld.cpp -o HelloWorld && ./HelloWorld && rm HelloWorld",
  "go": "go run HelloWorld.go",
  "csharp": "mcs HelloWorld.cs && mono HelloWorld.exe && rm HelloWorld.exe",
  "perl": "perl HelloWorld.pl",
  #"swift": "swift HelloWorld.swift",
  #"typescript": "tsc HelloWorld.ts --outFile HelloWorld.ts.js && node HelloWorld.ts.js && rm HelloWorld.ts.js",
}

results = []
def execLang(lang, cmd):
    start = time.time()
    response = subprocess.check_output(cmd, shell=True).replace("\n", "\\n")
    elapsedMs = (time.time() - start) * 1000
    results.append((lang, response, elapsedMs),)

gstart = time.time()

def runMultithreaded():
    threads = []
    for item in cmds.iteritems():
        t = threading.Thread(target=execLang, args=item)
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()

def runSequentially():
    for item in cmds.iteritems():
        execLang(*item)

#runSequentially()
runMultithreaded()

gelapsedMs = (time.time() - gstart) * 1000

print "elapsed: %dms" % gelapsedMs
for (lang, response, elapsedMs) in results:
    print "%s: '%s' (%dms)" % (lang, response, elapsedMs)