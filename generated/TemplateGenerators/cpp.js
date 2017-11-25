({
    expressionGenerators: {
        Call(expr, ...args) {
            return tmpl`${this.gen(expr.method)}(${tmpl.Block((expr.arguments||[]).map(arg => tmpl`${this.gen(arg)}`).join(", "))})`;
        },
        
        PropertyAccess(expr, ...args) {
            return tmpl`${this.gen(expr.object)}->${this.gen(expr.propertyName)}`;
        },
        
        Identifier(expr, ...args) {
            return tmpl`${expr.text}`;
        },
        
        StringLiteral(expr, ...args) {
            return tmpl`std::string("${expr.escapedText}")`;
        },
        
        CharacterLiteral(expr, ...args) {
            return tmpl`'${expr.escapedText}'`;
        },
        
        Return(expr, ...args) {
            return tmpl`return ${this.gen(expr.expression)};`;
        },
        
        Binary(expr, ...args) {
            return tmpl`${this.gen(expr.left)} ${expr.operator} ${this.gen(expr.right)}`;
        },
        
        Postfix(expr, ...args) {
            return tmpl`${this.gen(expr.operand)}${expr.operator}`;
        },
        
        Prefix(expr, ...args) {
            return tmpl`${expr.operator}${this.gen(expr.operand)}`;
        },
        
        Parenthesized(expr, ...args) {
            return tmpl`(${this.gen(expr.expression)})`;
        },
        
        NumericLiteral(expr, ...args) {
            return tmpl`${expr.value}`;
        },
        
        NullLiteral(expr, ...args) {
            return tmpl`nullptr`;
        },
        
        VariableDeclaration(expr, ...args) {
            return tmpl`${this.genVar(expr)};`;
        },
        
        New(expr, ...args) {
            return tmpl`std::make_shared<${this.gen(expr.cls)}>(${this.genParams(expr.arguments)})`;
        },
        
        ClassReference(expr, ...args) {
            return tmpl`${expr.classRef.name}`;
        },
        
        ArrayLiteral(expr, ...args) {
            return tmpl`std::make_shared<std::vector<${expr.typeArgs[0]}>>(std::vector<${expr.typeArgs[0]}> { ${this.genParams(expr.items)} })`;
        },
        
        MapLiteral(expr, ...args) {
            return tmpl`
                std::make_shared<std::map<${expr.typeArgs[0]}, ${expr.typeArgs[1]}>>(std::map<${expr.typeArgs[0]}, ${expr.typeArgs[1]}> {
                  ${tmpl.Block((expr.properties||[]).map(prop => tmpl`
                      { "${prop.name}", ${this.gen(prop.initializer)} }`).join(",\n"))}
                })`;
        },
        
        ExpressionStatement(expr, ...args) {
            return tmpl`${this.gen(expr.expression)};`;
        },
        
        InstanceMethod(expr, ...args) {
            return tmpl`${this.gen(expr.thisExpr)}->${expr.methodRef.name}`;
        },
        
        StaticMethod(expr, ...args) {
            return tmpl`${expr.methodRef.classRef.name}::${expr.methodRef.name}`;
        },
        
        LocalVar(expr, ...args) {
            return tmpl`${expr.varRef.name}`;
        },
        
        MethodArgument(expr, ...args) {
            return tmpl`${expr.varRef.name}`;
        },
        
        InstanceField(expr, ...args) {
            return tmpl`${this.gen(expr.thisExpr)}->${expr.varRef.name}`;
        },
        
        StaticField(expr, ...args) {
            return tmpl`${this.gen(expr.thisExpr)}::${expr.varRef.name}`;
        },
        
        FalseLiteral(expr, ...args) {
            return tmpl`false`;
        },
        
        TrueLiteral(expr, ...args) {
            return tmpl`true`;
        },
        
        ElementAccess(expr, ...args) {
            return tmpl`(*${this.gen(expr.object)})[${this.gen(expr.elementExpr)}]`;
        },
        
        ThisReference(expr, ...args) {
            return tmpl`this`;
        },
        
        Conditional(expr, ...args) {
            return tmpl`${this.gen(expr.condition)} ? ${this.gen(expr.whenTrue)} : ${this.gen(expr.whenFalse)}`;
        },
        
        TemplateString(expr, ...args) {
            return tmpl`
                std::string(){space}+{space}${tmpl.Block((expr.parts||[]).map(part => tmpl`${tmpl.Block((part.literal) ? tmpl`"${part.text}"` : tmpl`${tmpl.Block((part.expr.valueType.isNumber) ? tmpl`std::to_string(${this.gen(part.expr)})` : tmpl`${tmpl.Block((part.expr.valueType.isBoolean) ? tmpl`((${this.gen(part.expr)}) ? "true" : "false")` : tmpl`
                    ${this.gen(part.expr)}`)}`)}`)}`).join(" + "))}`;
        },
        
        Foreach(expr, ...args) {
            return tmpl`
                for (auto it = ${this.gen(expr.items)}->begin(); it != ${this.gen(expr.items)}->end(); ++it) {
                    auto ${expr.itemVariable.name} = *it;
                    ${this.genBody(expr.body)}
                }`;
        },
        
        For(expr, ...args) {
            return tmpl`
                for (${this.genVar(expr.itemVariable)}; ${this.gen(expr.condition)}; ${this.gen(expr.incrementor)}) {
                    ${this.genBody(expr.body)}
                }`;
        },
        
        While(expr, ...args) {
            return tmpl`
                while (${this.gen(expr.condition)}) {
                    ${this.genBody(expr.body)}
                }`;
        },
        
        Break(expr, ...args) {
            return tmpl`break`;
        },
        
        If(expr, ...args) {
            return tmpl`
                if (${this.gen(expr.condition)}) {
                    ${this.genBody(expr.then)}
                }${tmpl.Block((expr.else) ? tmpl`${tmpl.Block((this.isIfBlock(expr.else)) ? tmpl`
                    {space}else{space}${this.genBody(expr.else)}` : tmpl`
                    {space}else {
                    {space}   ${this.genBody(expr.else)}
                    }`)}` : tmpl``)}`;
        },
    },

    classGenerators: {
        OneString: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`std::string`;
            },
        
            methods: {
                substring(self, typeArgs, start, end, ...args) {
                    return tmpl`${self}.substr(${start}, ${end} - ${start})`;
                },
                
                split(self, typeArgs, separator, ...args) {
                    return tmpl`OneStringHelper::split(${self}, ${separator})`;
                },
                
                get(self, typeArgs, idx, ...args) {
                    return tmpl`${self}[${idx}]`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`${self}.size()`;
                },
            }
        },
        
        OneNumber: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`int`;
            },
        
            methods: {
                
            },
        
            fields: {
                
            }
        },
        
        OneBoolean: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`bool`;
            },
        
            methods: {
                
            },
        
            fields: {
                
            }
        },
        
        OneArray: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`std::vector<${typeArgs[0]}>`;
            },
        
            methods: {
                add(self, typeArgs, item, ...args) {
                    return tmpl`${self}->push_back(${item})`;
                },
                
                get(self, typeArgs, index, ...args) {
                    return tmpl`${self}->at(${index})`;
                },
                
                set(self, typeArgs, index, value, ...args) {
                    return tmpl`(*${self})[${index}] = ${value}`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`${self}->size()`;
                },
            }
        },
        
        OneMap: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneMap`;
            },
        
            methods: {
                keys(self, typeArgs, ...args) {
                    return tmpl`OneMapHelper::keys(*${self})`;
                },
                
                values(self, typeArgs, ...args) {
                    return tmpl`OneMapHelper::values(*${self})`;
                },
                
                remove(self, typeArgs, key, ...args) {
                    return tmpl`${self}->erase(${key})`;
                },
                
                hasKey(self, typeArgs, key, ...args) {
                    return tmpl`${self}->find(${key}) != ${self}->end()`;
                },
                
                get(self, typeArgs, key, ...args) {
                    return tmpl`(*${self})[${key}]`;
                },
                
                set(self, typeArgs, key, value, ...args) {
                    return tmpl`(*${self})[${key}] = ${value}`;
                },
            },
        
            fields: {
                
            }
        },
        
        OneConsole: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneConsole`;
            },
        
            methods: {
                print(self, typeArgs, str, ...args) {
                    return tmpl`std::cout << (${str}) << std::endl`;
                },
            },
        
            fields: {
                
            }
        }
    },

    operatorGenerators: {
        "OneString + OneNumber"(left, right, ...args) {
            return tmpl`${this.gen(left)} + std::to_string(${this.gen(right)})`;
        },
        
        "OneString + OneBoolean"(left, right, ...args) {
            return tmpl`${this.gen(left)} + (${this.gen(right)} ? "true" : "false")`;
        },
    },

    testGenerator(cls, method, ...args) {
        return tmpl`
            int main()
            {
                ${cls} c;
                c.${method}();
                return 0;
            }`;
    },
    
    main(...args) {
        return tmpl`
            ${tmpl.Block((this.includes||[]).map(inc => tmpl`
                #include <${inc}>`).join("\n"))}
            
            class OneMapHelper {
              public:
                template<typename K, typename V> static std::shared_ptr<std::vector<K>> keys(const std::map<K,V>& map) {
                    std::vector<K> result;
                    for(auto it = map.begin(); it != map.end(); ++it)
                        result.push_back(it->first);
                    return std::make_shared<std::vector<K>>(result);
                }
            
                template<typename K, typename V> static std::shared_ptr<std::vector<V>> values(const std::map<K,V>& map) {
                    std::vector<V> result;
                    for(auto it = map.begin(); it != map.end(); ++it)
                        result.push_back(it->second);
                    return std::make_shared<std::vector<V>>(result);
                }
            };
            
            class OneStringHelper {
              public:
                static std::shared_ptr<std::vector<std::string>> split(const std::string& str, const std::string& delim)
                {
                    std::vector<std::string> tokens;
                    
                    size_t prev = 0, pos = 0;
                    do
                    {
                        pos = str.find(delim, prev);
                        if (pos == std::string::npos) pos = str.length();
                        std::string token = str.substr(prev, pos - prev);
                        tokens.push_back(token);
                        prev = pos + delim.length();
                    }
                    while (pos < str.length() && prev < str.length());
            
                    return std::make_shared<std::vector<std::string>>(tokens);
                }
            };
            
            class OneFile {
              public:
                static std::string readText(const std::string& path)
                {
                  std::ifstream file(path);
                  std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
                  return content;
                }
            };
            
            ${tmpl.Block((this.classes||[]).map(cls => tmpl`
                class ${cls.name} {
                  public:
                    ${this.genFields(cls.publicFields)}
                
                    ${tmpl.Block((cls.constructor) ? tmpl`
                  ${cls.name}(${this.genArgs(cls.constructor)}) {
                      ${this.genBody(cls.constructor.body)}
                  }` : tmpl``)}
                
                    ${this.genMethods(cls.publicMethods)}
                
                  private:
                    ${this.genFields(cls.privateFields)}
                    
                    ${this.genMethods(cls.privateMethods)}
                };
                
                ${tmpl.Block((cls.fields||[]).map(field => tmpl`
                    ${tmpl.Block((field.static&&field.initializer) ? tmpl`
                          ${this.getType(field)} ${cls.name}::${field.name} = ${this.gen(field.initializer)};` : tmpl``)}`).join("\n"))}`).join("\n\n"))}`;
    },
    
    genFields(fields, ...args) {
        return tmpl`
            ${tmpl.Block((fields||[]).map(field => tmpl`
                ${tmpl.Block((field.static) ? tmpl`static ` : tmpl``)}${this.getType(field)} ${field.name};`).join("\n"))}`;
    },
    
    getType(item, ...args) {
        return tmpl`${item.type}${tmpl.Block((item.typeInfo.isComplexClass) ? tmpl`*` : tmpl``)}`;
    },
    
    getTypeX(type, ...args) {
        return tmpl`${this.typeName(type)}${tmpl.Block((type.isComplexClass) ? tmpl`*` : tmpl``)}`;
    },
    
    genMethods(methods, ...args) {
        return tmpl`
            ${tmpl.Block((methods||[]).map(method => tmpl`
                ${method.returnType} ${method.name}(${this.genArgs(method)}) {
                    ${this.genBody(method.body)}
                }`).join("\n\n"))}`;
    },
    
    genBody(body, ...args) {
        return tmpl`
            ${tmpl.Block((body.statements||[]).map(statement => tmpl`
                ${statement.leadingTrivia}${this.gen(statement)}`).join("\n"))}`;
    },
    
    genArgs(method, ...args) {
        return tmpl`
            ${tmpl.Block((method.parameters||[]).map(param => tmpl`
                ${param.type} ${param.name}`).join(", "))}`;
    },
    
    genParams(params, ...args) {
        return tmpl`${tmpl.Block((params||[]).map(param => tmpl`${this.gen(param)}`).join(", "))}`;
    },
    
    genVar(itemVar, ...args) {
        return tmpl`${tmpl.Block((itemVar.type.isNumber) ? tmpl`int` : tmpl`auto`)} ${itemVar.name} = ${this.gen(itemVar.initializer)}`;
    },
})