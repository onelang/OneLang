import { LangFileSchema } from "./LangFileSchema";
import { deindent } from "./Utils";

export interface LangConfig {
    name?: string;
    port: number;
    request: {
        lang?: string;
        code: string;
        className?: string;
        methodName?: string;
    };
    schema?: LangFileSchema.LangFile;
}

export const langConfigs: { [name: string]: LangConfig } = {
    cpp: {
        port: 8000,
        request: {
            lang: "CPP",
            code: deindent(`
                #include <iostream>
                    
                class TestClass {
                    public:
                    void testMethod() {
                        std::cout << "Hello World!\\n";
                    }
                };
                
                int main()
                {
                    TestClass c;
                    c.testMethod();
                    return 0;
                }`)
        }
    },
    csharp: {
        port: 8000,
        request: {
            lang: "CSharp",
            code: deindent(`
                using System;
                
                public class TestClass
                {
                    public void TestMethod()
                    {
                        Console.WriteLine("Hello World!");
                    }
                }
                
                public class HelloWorld
                {
                    static public void Main()
                    {
                        new TestClass().TestMethod();
                    }
                }`)
        }
    },
    go: {
        port: 8000,
        request: {
            lang: "Go",
            code: deindent(`
                package main
                
                import "fmt"
                
                type testClass struct {
                }
                
                func (this *testClass) testMethod() {
                    fmt.Println("Hello World!")
                }
                
                func main() {
                    c := (testClass{})
                    c.testMethod()
                }`)
        }
    },
    java: {
        port: 8001,
        request: {
            code: deindent(`
                public class TestClass {
                    public String testMethod() {
                        return "Hello World!";
                    }
                }`),
            className: 'TestClass',
            methodName: 'testMethod'
        }
    },
    javascript: {
        port: 8002,
        request: {
            code: deindent(`
                class TestClass {
                    testMethod() {
                        return "Hello World!";
                    }
                }
                
                new TestClass().testMethod()`),
            className: 'TestClass',
            methodName: 'testMethod'
        },
    },
    perl: {
        port: 8000,
        request: {
            lang: "Perl",
            code: deindent(`
                use strict;
                use warnings;
                
                package TestClass;
                sub new
                {
                    my $class = shift;
                    my $self = {};
                    bless $self, $class;
                    return $self;
                }
                
                sub testMethod {
                    print "Hello World!\\n";
                }
                
                package Program;
                my $c = new TestClass();
                $c->testMethod()`)
        }
    },
    php: {
        port: 8003,
        request: {
            lang: "PHP",
            code: deindent(`
                <?php
                
                class TestClass {
                    function testMethod() {
                        return "Hello World!";
                    }
                }`),
            className: 'TestClass',
            methodName: 'testMethod'
        }
    },
    python: {
        port: 8004,
        request: {
            lang: "Python",
            className: 'TestClass',
            methodName: 'test_method',
            code: deindent(`
                class TestClass:
                    def test_method(self):
                        return  "Hello World!"`)
        }
    },
    ruby: {
        port: 8005,
        request: {
            lang: "Ruby",
            className: 'TestClass',
            methodName: 'test_method',
            code: deindent(`
                class TestClass
                    def test_method
                        return "Hello World!"
                    end
                end`)
        }
    },
    swift: {
        port: 8000,
        request: {
            lang: "Swift",
            code: deindent(`
                class TestClass {
                    func testMethod() {
                        print("Hello World!")
                    }
                }
                
                TestClass().testMethod()`)
        }
    },
    typescript: {
        port: 8002,
        request: {
            lang: "TypeScript",
            className: 'TestClass',
            methodName: 'testMethod',
            code: deindent(`
                class TestClass {
                    testMethod() {
                        return "Hello World!";
                    }
                }
                
                new TestClass().testMethod()`),
        },
    },
};

export interface CompileResult {
    result?: string;
    elapsedMs?: number;
    exceptionText?: string;
}

for (const langName of Object.keys(langConfigs))
    langConfigs[langName].name = langName;