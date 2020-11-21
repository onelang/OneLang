import yaml
from .YamlValue import YamlValue

class OneYaml:
    @staticmethod
    def load(content):
        return YamlValue(yaml.safe_load(content))