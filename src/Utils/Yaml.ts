import * as YAML from "js-yaml";

export class Yaml {
    static load<T>(content: string): T {
        // @csharp return YAML.safeLoad<T>(content);
        return <T>YAML.safeLoad(content);
    }
}