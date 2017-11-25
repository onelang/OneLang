({
    expressionGenerators: {
        Call(expr, ...args) {
            return tmpl`${this.gen(expr.method)}(${this.genMethodArgs(expr.arguments)})`;
        },
        
        StringLiteral(expr, ...args) {
            return tmpl`${expr.escapedText}`;
        },
        
        CharacterLiteral(expr, ...args) {
            return tmpl`${expr.escapedText}`;
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
        
        "Postfix++"(expr, ...args) {
            return tmpl`${this.gen(expr.operand)} += 1`;
        },
        
        "Postfix--"(expr, ...args) {
            return tmpl`${this.gen(expr.operand)} -= 1`;
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
            return tmpl`nil`;
        },
        
        VariableDeclaration(expr, ...args) {
            return tmpl`${this.genVar(expr)}`;
        },
        
        New(expr, ...args) {
            return tmpl`${this.gen(expr.cls)}(${this.genMethodArgs(expr.arguments)})`;
        },
        
        ClassReference(expr, ...args) {
            return tmpl`${expr.classRef.name}`;
        },
        
        ArrayLiteral(expr, ...args) {
            return tmpl`[${this.genParams(expr.items)}]`;
        },
        
        MapLiteral(expr, ...args) {
            return tmpl`
                [
                  ${tmpl.Block((expr.properties||[]).map(prop => tmpl`
                      "${prop.name}": ${this.gen(prop.initializer)}`).join(",\n"))}
                ]`;
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
            return tmpl`${this.gen(expr.thisExpr)}.${expr.varRef.name}${tmpl.Block((expr.valueType.isComplexClass) ? tmpl`!` : tmpl``)}`;
        },
        
        StaticField(expr, ...args) {
            return tmpl`${this.gen(expr.thisExpr)}.${expr.varRef.name}${tmpl.Block((expr.valueType.isComplexClass) ? tmpl`!` : tmpl``)}`;
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
            return tmpl`self`;
        },
        
        Conditional(expr, ...args) {
            return tmpl`${this.gen(expr.condition)} ? ${this.gen(expr.whenTrue)} : ${this.gen(expr.whenFalse)}`;
        },
        
        Break(expr, ...args) {
            return tmpl`break`;
        },
        
        TemplateString(expr, ...args) {
            return tmpl`
                "${tmpl.Block((expr.parts||[]).map(part => tmpl`${tmpl.Block((part.literal) ? tmpl`${part.text}` : tmpl`
                    \\(${this.gen(part.expr)})`)}`).join(""))}"`;
        },
        
        Foreach(expr, ...args) {
            return tmpl`
                for ${expr.itemVariable.name} in ${this.gen(expr.items)} {
                    ${this.genBody(expr.body)}
                }`;
        },
        
        For(expr, ...args) {
            return tmpl`
                ${this.genVar(expr.itemVariable)}
                while ${this.gen(expr.condition)} {
                    ${this.genBody(expr.body)}
                    ${this.gen(expr.incrementor)}
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
                return tmpl`String`;
            },
        
            methods: {
                substring(self, typeArgs, start, end, ...args) {
                    return tmpl`${self}[${self}.index(${self}.startIndex, offsetBy: ${start}) ..< ${self}.index(${self}.startIndex, offsetBy: ${end})]`;
                },
                
                split(self, typeArgs, separator, ...args) {
                    return tmpl`${self}.split(separator: ${separator}, omittingEmptySubsequences: false)`;
                },
                
                get(self, typeArgs, idx, ...args) {
                    return tmpl`String(${self}[${self}.index(${self}.startIndex, offsetBy: ${idx})])`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`${self}.count`;
                },
            }
        },
        
        OneNumber: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`Int`;
            },
        
            methods: {
                
            },
        
            fields: {
                
            }
        },
        
        OneBoolean: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`Bool`;
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
                    return tmpl`print(${str})`;
                },
            },
        
            fields: {
                
            }
        },
        
        OneArray: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`[${typeArgs[0]}]`;
            },
        
            methods: {
                add(self, typeArgs, item, ...args) {
                    return tmpl`${self}.append(${item})`;
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
                    return tmpl`${self}.count`;
                },
            }
        },
        
        OneMap: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneMap`;
            },
        
            methods: {
                keys(self, typeArgs, ...args) {
                    return tmpl`Array(${self}.keys)`;
                },
                
                values(self, typeArgs, ...args) {
                    return tmpl`Array(${self}.values)`;
                },
                
                remove(self, typeArgs, key, ...args) {
                    return tmpl`${self}[${key}] = nil`;
                },
                
                hasKey(self, typeArgs, key, ...args) {
                    return tmpl`${self}[${key}] != nil`;
                },
                
                get(self, typeArgs, key, ...args) {
                    return tmpl`${self}[${key}]!`;
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
                readText(self, typeArgs, fn, ...args) {
                    return tmpl`try! String(contentsOfFile: ${fn}, encoding: String.Encoding.utf8)`;
                },
            },
        
            fields: {
                
            }
        }
    },

    operatorGenerators: {
        
    },

    testGenerator(cls, method, ...args) {
        return tmpl`${cls}().${method}()`;
    },
    
    main(...args) {
        return tmpl`
            ${tmpl.Block((this.includes||[]).map(inc => tmpl`
                import ${inc}`).join("\n"))}
            
            ${tmpl.Block((this.classes||[]).map(cls => tmpl`
                class ${cls.name} {
                  ${tmpl.Block((cls.fields||[]).map(field => tmpl`
                        ${tmpl.Block((field.static) ? tmpl`static ` : tmpl``)}var ${field.name}: ${field.type}${tmpl.Block((field.type.isComplexClass) ? tmpl`?` : tmpl``)}${tmpl.Block((field.initializer) ? tmpl`{space}= ${this.gen(field.initializer)}` : tmpl``)}`).join("\n"))}
                
                  ${tmpl.Block((cls.constructor) ? tmpl`
                init(${this.genArgs(cls.constructor)}) {
                    ${this.genBody(cls.constructor.body)}
                }` : tmpl``)}
                
                  ${tmpl.Block((cls.methods||[]).map(method => tmpl`
                        func ${method.name}(${this.genArgs(method)}) -> ${method.returnType} {
                            ${this.genBody(method.body)}
                        }`).join("\n\n"))}
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
                ${param.name}: ${param.type}`).join(", "))}`;
    },
    
    genParams(params, ...args) {
        return tmpl`${tmpl.Block((params||[]).map(param => tmpl`${this.gen(param)}`).join(", "))}`;
    },
    
    genVar(itemVar, ...args) {
        return tmpl`${tmpl.Block((itemVar.isMutable) ? tmpl`var` : tmpl`let`)} ${tmpl.Block((itemVar.isUnused) ? tmpl`_` : tmpl`${itemVar.name}`)} = ${this.gen(itemVar.initializer)}`;
    },
    
    genMethodArgs(methodArgs, ...args) {
        return tmpl`${tmpl.Block((methodArgs||[]).map(arg => tmpl`${arg.paramName}: ${this.gen(arg)}`).join(", "))}`;
    },
})