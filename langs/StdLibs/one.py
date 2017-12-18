import re

class Regex:
    @staticmethod
    def matchFromIndex(pattern, input, offset):
        patternObj = re.compile(pattern)
        match = patternObj.match(input, offset)
        if not match:
            return None
        return list(match.group(0)) + list(match.groups())