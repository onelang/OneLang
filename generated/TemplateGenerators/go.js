({
    expressionGenerators: {
        Call(expr, ...args) {
            return tmpl`${this.gen(expr.method)}(${tmpl.Block((expr.arguments||[]).map(arg => tmpl`${this.gen(arg)}`).join(", "))})`;
        },
        
        PropertyAccess(expr, ...args) {
            return tmpl`${this.gen(expr.object)}.${this.gen(expr.propertyName)}`;
        },
        
        Identifier(expr, ...args) {
            return tmpl`${expr.text}`;
        },
        
        StringLiteral(expr, ...args) {
            return tmpl`${expr.escapedText}`;
        },
        
        CharacterLiteral(expr, ...args) {
            return tmpl`'${expr.value}'`;
        },
        
        NullLiteral(expr, ...args) {
            return tmpl`nil`;
        },
        
        Return(expr, ...args) {
            return tmpl`return ${this.gen(expr.expression)}`;
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
        
        VariableDeclaration(expr, ...args) {
            return tmpl`${this.genVar(expr)}`;
        },
        
        New(expr, ...args) {
            return tmpl`New${this.gen(expr.cls)}(${this.genParams(expr.arguments)})`;
        },
        
        ClassReference(expr, ...args) {
            return tmpl`${expr.classRef.name}`;
        },
        
        ArrayLiteral(expr, ...args) {
            return tmpl`[]${expr.typeArgs[0]}{${this.genParams(expr.items)}}`;
        },
        
        MapLiteral(expr, ...args) {
            return tmpl`
                map[${expr.typeArgs[0]}]${expr.typeArgs[1]}{
                  ${tmpl.Block((expr.properties||[]).map(prop => tmpl`
                      "${prop.name}": ${this.gen(prop.initializer)},`).join("\n"))}
                }`;
        },
        
        ExpressionStatement(expr, ...args) {
            return tmpl`${this.gen(expr.expression)}`;
        },
        
        InstanceMethod(expr, ...args) {
            return tmpl`${this.gen(expr.thisExpr)}.${expr.methodRef.name}`;
        },
        
        StaticMethod(expr, ...args) {
            return tmpl`${expr.methodRef.classRef.name}.${expr.methodRef.name}`;
        },
        
        LocalVar(expr, ...args) {
            return tmpl`${expr.varRef.name}`;
        },
        
        MethodArgument(expr, ...args) {
            return tmpl`${expr.varRef.name}`;
        },
        
        InstanceField(expr, ...args) {
            return tmpl`${this.gen(expr.thisExpr)}.${expr.varRef.name}`;
        },
        
        StaticField(expr, ...args) {
            return tmpl`${this.gen(expr.thisExpr)}${expr.varRef.name}`;
        },
        
        FalseLiteral(expr, ...args) {
            return tmpl`false`;
        },
        
        TrueLiteral(expr, ...args) {
            return tmpl`true`;
        },
        
        ElementAccess(expr, ...args) {
            return tmpl`${this.gen(expr.object)}[${this.gen(expr.elementExpr)}]`;
        },
        
        ThisReference(expr, ...args) {
            return tmpl`this`;
        },
        
        Break(expr, ...args) {
            return tmpl`break`;
        },
        
        TemplateString(expr, ...args) {
            return tmpl`
                fmt.Sprintf("${tmpl.Block((expr.parts||[]).map(part => tmpl`${tmpl.Block((part.literal) ? tmpl`${part.text}` : tmpl`
                    %v`)}`).join(""))}"${tmpl.Block((expr.parts||[]).map(part => tmpl`${tmpl.Block((part.expr) ? tmpl`, ${this.gen(part.expr)}` : tmpl``)}`).join(""))})`;
        },
        
        Conditional(expr, ...args) {
            return tmpl`
                var ${this.result} ${this.typeName(expr.valueType)}
                if ${this.gen(expr.condition)} {
                  ${this.result} = ${this.gen(expr.whenTrue)}
                } else {
                  ${this.result} = ${this.gen(expr.whenFalse)}
                }`;
        },
        
        Foreach(expr, ...args) {
            return tmpl`
                for _, ${expr.itemVariable.name} := range ${this.gen(expr.items)} {
                    ${this.genBody(expr.body)}
                }`;
        },
        
        For(expr, ...args) {
            return tmpl`
                for ${this.genVar(expr.itemVariable)}; ${this.gen(expr.condition)}; ${this.gen(expr.incrementor)} {
                    ${this.genBody(expr.body)}
                }`;
        },
        
        While(expr, ...args) {
            return tmpl`
                while ${this.gen(expr.condition)} {
                    ${this.genBody(expr.body)}
                }`;
        },
        
        If(expr, ...args) {
            return tmpl`
                if ${this.gen(expr.condition)} {
                    ${this.genBody(expr.then)}
                }${tmpl.Block((expr.else) ? tmpl`${tmpl.Block((this.isIfBlock(expr.else)) ? tmpl`
                    {space}else{space}${this.genBody(expr.else)}` : tmpl`
                    {space}else {
                  ${this.genBody(expr.else)}
                    }`)}` : tmpl``)}`;
        },
    },

    classGenerators: {
        OneString: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`string`;
            },
        
            methods: {
                substring(self, typeArgs, start, end, ...args) {
                    return tmpl`${self}[${start}:${end}]`;
                },
                
                split(self, typeArgs, separator, ...args) {
                    return tmpl`strings.Split(${self}, ${separator})`;
                },
                
                get(self, typeArgs, idx, ...args) {
                    return tmpl`${self}[${idx}]`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`len(${self})`;
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
        
        OneConsole: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneConsole`;
            },
        
            methods: {
                print(self, typeArgs, str, ...args) {
                    return tmpl`fmt.Println(${str})`;
                },
            },
        
            fields: {
                
            }
        },
        
        OneArray: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneArray`;
            },
        
            methods: {
                add(self, typeArgs, item, ...args) {
                    return tmpl`${self} = append(${self}, ${item})`;
                },
                
                get(self, typeArgs, index, ...args) {
                    return tmpl`${self}[${index}]`;
                },
                
                set(self, typeArgs, index, value, ...args) {
                    return tmpl`${self}[${index}] = ${value}`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`len(${self})`;
                },
            }
        },
        
        OneMap: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneMap`;
            },
        
            methods: {
                keys(self, typeArgs, result, ...args) {
                    return tmpl`
                        ${result} := make([]${typeArgs[0]}, 0, len(${self}))
                        for  key, _ := range ${self} {
                          ${result} = append(${result}, key)
                        }`;
                },
                
                values(self, typeArgs, result, ...args) {
                    return tmpl`
                        ${result} := make([]${typeArgs[1]}, 0, len(${self}))
                        for  _, value := range ${self} {
                          ${result} = append(${result}, value)
                        }`;
                },
                
                remove(self, typeArgs, key, ...args) {
                    return tmpl`delete(${self}, ${key})`;
                },
                
                hasKey(self, typeArgs, key, result, ...args) {
                    return tmpl`_, ${result} := ${self}[${key}]`;
                },
                
                get(self, typeArgs, key, ...args) {
                    return tmpl`${self}[${key}]`;
                },
                
                set(self, typeArgs, key, value, ...args) {
                    return tmpl`${self}[${key}] = ${value}`;
                },
            },
        
            fields: {
                
            }
        },
        
        OneFile: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneFile`;
            },
        
            methods: {
                readText(self, typeArgs, fn, result, ...args) {
                    return tmpl`
                        file_content_bytes, _ := ioutil.ReadFile(${fn})
                        ${result} := string(file_content_bytes)`;
                },
            },
        
            fields: {
                
            }
        }
    },

    operatorGenerators: {
        "OneString + OneNumber"(left, right, ...args) {
            return tmpl`${this.gen(left)} + strconv.Itoa(${this.gen(right)})`;
        },
        
        "OneString + OneBoolean"(left, right, ...args) {
            return tmpl`${this.gen(left)} + strconv.FormatBool(${this.gen(right)})`;
        },
    },

    testGenerator(cls, method, ...args) {
        return tmpl`
            func main() {
                c := (${cls}{})
                c.${method}();
            }`;
    },
    
    main(...args) {
        return tmpl`
            package main
            
            ${tmpl.Block((this.includes||[]).map(inc => tmpl`
                import "${inc}"`).join("\n"))}
            
            ${tmpl.Block((this.classes||[]).map(cls => tmpl`
                type ${cls.name} struct {
                    ${tmpl.Block((cls.fields||[]).map(field => tmpl`
                        ${field.name} ${this.getType(field)}`).join("\n"))}
                }
                
                func New${cls.name}(${tmpl.Block((cls.constructor) ? tmpl`${this.genArgs(cls.constructor)}` : tmpl``)}) *${cls.name} {
                    this := new(${cls.name})
                    ${tmpl.Block((cls.constructor) ? tmpl`
                  ${this.genBody(cls.constructor.body)}` : tmpl``)}
                    return this
                }
                
                ${tmpl.Block((cls.methods||[]).map(method => tmpl`
                    func (this *${cls.name}) ${method.name}(${this.genArgs(method)}) ${method.returnType} {
                        ${this.genBody(method.body)}
                    }`).join("\n\n"))}
                
                ${tmpl.Block((cls.fields||[]).map(field => tmpl`
                    var ${cls.name}${field.name} ${field.type}${tmpl.Block((field.initializer) ? tmpl`{space}= ${this.gen(field.initializer)}` : tmpl``)};`).join("\n"))}`).join("\n\n"))}`;
    },
    
    getType(item, ...args) {
        return tmpl`${tmpl.Block((item.typeInfo.isComplexClass) ? tmpl`*` : tmpl``)}${item.type}`;
    },
    
    genBody(body, ...args) {
        return tmpl`
            ${tmpl.Block((body.statements||[]).map(statement => tmpl`
                ${statement.leadingTrivia}${this.gen(statement)}`).join("\n"))}`;
    },
    
    genArgs(method, ...args) {
        return tmpl`
            ${tmpl.Block((method.parameters||[]).map(param => tmpl`
                ${param.name} ${param.type}`).join(", "))}`;
    },
    
    genParams(params, ...args) {
        return tmpl`${tmpl.Block((params||[]).map(param => tmpl`${this.gen(param)}`).join(", "))}`;
    },
    
    genVar(itemVar, ...args) {
        return tmpl`${itemVar.name} := ${this.gen(itemVar.initializer)}`;
    },
})