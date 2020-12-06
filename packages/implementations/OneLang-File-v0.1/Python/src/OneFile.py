import pathlib
import os
import shutil

class OneFile:
    def read_text(fn):
        with open(fn, newline='') as f: return f.read()
    
    def write_text(fn, content):
        os.makedirs(os.path.dirname(fn), exist_ok=True)
        with open(fn, 'w') as f: f.write(content)

    def list_files(dir, recursive):
        files = list(sorted([str(x.relative_to(dir)) for x in pathlib.Path(dir).glob("**/*") if x.is_file()]))
        return files

    def copy(src, dst):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy(src, dst)

