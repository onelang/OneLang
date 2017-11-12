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
        
        NullLiteral(expr, ...args) {
            return tmpl`null`;
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
        
        VariableDeclaration(expr, ...args) {
            return tmpl`${this.genVar(expr)};`;
        },
        
        New(expr, ...args) {
            return tmpl`new ${this.gen(expr.cls)}(${this.genParams(expr.arguments)})`;
        },
        
        ClassReference(expr, ...args) {
            return tmpl`${expr.classRef.name}`;
        },
        
        ArrayLiteral(expr, ...args) {
            return tmpl`[${this.genParams(expr.items)}]`;
        },
        
        MapLiteral(expr, ...args) {
            return tmpl`
                {
                  ${tmpl.Block((expr.properties||[]).map(prop => tmpl`
                      ${prop.name}: ${this.gen(prop.initializer)}`).join(",\n"))}
                }`;
        },
        
        ExpressionStatement(expr, ...args) {
            return tmpl`${this.gen(expr.expression)};`;
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
            return tmpl`${this.gen(expr.thisExpr)}.${expr.varRef.name}`;
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
        
        Conditional(expr, ...args) {
            return tmpl`${this.gen(expr.condition)} ? ${this.gen(expr.whenTrue)} : ${this.gen(expr.whenFalse)}`;
        },
        
        Break(expr, ...args) {
            return tmpl`break`;
        },
        
        TemplateString(expr, ...args) {
            return tmpl`
                \`${tmpl.Block((expr.parts||[]).map(part => tmpl`${tmpl.Block((part.literal) ? tmpl`${part.text}` : tmpl`
                    \${${this.gen(part.expr)}}`)}`).join(""))}\``;
        },
        
        Foreach(expr, ...args) {
            return tmpl`
                for (const ${expr.itemVariable.name} of ${this.gen(expr.items)}) {
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
        
        If(expr, ...args) {
            return tmpl`
                if (${this.gen(expr.condition)}) {
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
                return tmpl`OneString`;
            },
        
            methods: {
                substring(self, typeArgs, start, end, ...args) {
                    return tmpl`${self}.substring(${start}, ${end})`;
                },
                
                split(self, typeArgs, separator, ...args) {
                    return tmpl`${self}.split(${separator})`;
                },
                
                get(self, typeArgs, idx, ...args) {
                    return tmpl`${self}[${idx}]`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`${self}.length`;
                },
            }
        },
        
        OneConsole: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneConsole`;
            },
        
            methods: {
                print(self, typeArgs, str, ...args) {
                    return tmpl`console.log(${str})`;
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
                    return tmpl`${self}.push(${item})`;
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
                    return tmpl`${self}.length`;
                },
            }
        },
        
        OneMap: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneMap`;
            },
        
            methods: {
                keys(self, typeArgs, ...args) {
                    return tmpl`Object.keys(${self})`;
                },
                
                values(self, typeArgs, ...args) {
                    return tmpl`Object.values(${self})`;
                },
                
                remove(self, typeArgs, key, ...args) {
                    return tmpl`delete ${self}[${key}]`;
                },
                
                hasKey(self, typeArgs, key, ...args) {
                    return tmpl`${key} in ${self}`;
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
                readText(self, typeArgs, fn, ...args) {
                    return tmpl`fs.readFileSync(${fn}, 'utf-8')`;
                },
            },
        
            fields: {
                
            }
        }
    },

    operatorGenerators: {
        
    },

    testGenerator(cls, method, ...args) {
        return tmpl`new ${cls}().${method}();`;
    },
    
    main(...args) {
        return tmpl`
            ${tmpl.Block((this.includes||[]).map(inc => tmpl`
                const ${inc} = require('${inc}');`).join("\n"))}
            
            ${tmpl.Block((this.classes||[]).map(cls => tmpl`
                class ${cls.name} {
                  ${tmpl.Block((cls.constructor) ? tmpl`
                constructor(${this.genArgs(cls.constructor)}) {
                    ${this.genBody(cls.constructor.body)}
                }` : tmpl``)}
                
                  ${tmpl.Block((cls.methods||[]).map(method => tmpl`
                      ${method.name}(${this.genArgs(method)}) {
                        ${this.genBody(method.body)}
                      }`).join("\n\n"))}
                }
                
                ${tmpl.Block((cls.fields||[]).map(field => tmpl`
                    ${tmpl.Block((field.static&&field.initializer) ? tmpl`
                          ${cls.name}.${field.name} = ${this.gen(field.initializer)};` : tmpl``)}`).join("\n"))}`).join("\n\n"))}`;
    },
    
    genBody(body, ...args) {
        return tmpl`
            ${tmpl.Block((body.statements||[]).map(statement => tmpl`
                ${statement.leadingTrivia}${this.gen(statement)}`).join("\n"))}`;
    },
    
    genArgs(method, ...args) {
        return tmpl`
            ${tmpl.Block((method.parameters||[]).map(param => tmpl`
                ${param.name}`).join(", "))}`;
    },
    
    genParams(params, ...args) {
        return tmpl`${tmpl.Block((params||[]).map(param => tmpl`${this.gen(param)}`).join(", "))}`;
    },
    
    genVar(itemVar, ...args) {
        return tmpl`${tmpl.Block((itemVar.isMutable) ? tmpl`let` : tmpl`const`)} ${itemVar.name} = ${this.gen(itemVar.initializer)}`;
    },
})