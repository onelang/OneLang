import glob
import os

class OneFile:
    def read_text(fn):
        with open(fn, 'r') as f: return f.read()
    
    def write_text(fn, content):
        os.makedirs(os.path.dirname(fn), exist_ok=True)
        with open(fn, 'w') as f: f.write(content)

    def list_files(dir, recursive):
        files = sorted(glob.glob(dir + "**/*", recursive=recursive))
        files = [x[len(dir):] for x in files if os.path.isfile(x)]
        return files
