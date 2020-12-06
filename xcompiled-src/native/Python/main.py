import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/onepkg")

from OneLang.Test.TestRunner import TestRunner

TestRunner("../../", sys.argv).run_tests()
