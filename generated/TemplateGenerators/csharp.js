({
    expressionGenerators: {
        Call(expr, ...args) {
            return tmpl`${this.gen(expr.method)}(${this.genParams(expr.arguments)})`;
        },
        
        PropertyAccess(expr, ...args) {
            return tmpl`${this.gen(expr.object)}.${this.gen(expr.propertyName)}`;
        },
        
        Identifier(expr, ...args) {
            return tmpl`${expr.text}`;
        },
        
        StringLiteral(expr, ...args) {
            return tmpl`"${expr.escapedText}"`;
        },
        
        CharacterLiteral(expr, ...args) {
            return tmpl`'${expr.escapedText}'`;
        },
        
        NumericLiteral(expr, ...args) {
            return tmpl`${expr.value}`;
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
            return tmpl`new List<${expr.typeArgs[0]}> { ${this.genParams(expr.items)} }`;
        },
        
        MapLiteral(expr, ...args) {
            return tmpl`
                new Dictionary<${expr.typeArgs[0]}, ${expr.typeArgs[1]}>
                {
                  ${tmpl.Block((expr.properties||[]).map(prop => tmpl`
                      { "${prop.name}", ${this.gen(prop.initializer)} }`).join(",\n"))}
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
            return tmpl`break;`;
        },
        
        TemplateString(expr, ...args) {
            return tmpl`
                \$"${tmpl.Block((expr.parts||[]).map(part => tmpl`${tmpl.Block((part.literal) ? tmpl`${part.text}` : tmpl`${tmpl.Block((part.expr.valueType.isBoolean) ? tmpl`{((${this.gen(part.expr)}) ? "true" : "false")}` : tmpl`
                    {${this.gen(part.expr)}}`)}`)}`).join(""))}"`;
        },
        
        Foreach(expr, ...args) {
            return tmpl`
                foreach (var ${expr.itemVariable.name} in ${this.gen(expr.items)})
                {
                    ${this.genBody(expr.body)}
                }`;
        },
        
        For(expr, ...args) {
            return tmpl`
                for (${this.genVar(expr.itemVariable)}; ${this.gen(expr.condition)}; ${this.gen(expr.incrementor)})
                {
                    ${this.genBody(expr.body)}
                }`;
        },
        
        While(expr, ...args) {
            return tmpl`
                while (${this.gen(expr.condition)})
                {
                    ${this.genBody(expr.body)}
                }`;
        },
        
        If(expr, ...args) {
            return tmpl`
                if (${this.gen(expr.condition)})
                {
                    ${this.genBody(expr.then)}
                }
                ${tmpl.Block((expr.else) ? tmpl`
                  ${tmpl.Block((this.isIfBlock(expr.else)) ? tmpl`
                    else{space}${this.genBody(expr.else)}` : tmpl`
                    else
                    {
                    {space}   ${this.genBody(expr.else)}
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
                    return tmpl`${self}.Substring(${start}, ${end} - ${start})`;
                },
                
                split(self, typeArgs, separator, ...args) {
                    return tmpl`${self}.Split(new[]{ ${separator} }, StringSplitOptions.None)`;
                },
                
                get(self, typeArgs, idx, ...args) {
                    return tmpl`${self}[${idx}]`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`${self}.Length`;
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
                    return tmpl`Console.WriteLine(${str})`;
                },
            },
        
            fields: {
                
            }
        },
        
        OneArray: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`List<${typeArgs[0]}>`;
            },
        
            methods: {
                add(self, typeArgs, item, ...args) {
                    return tmpl`${self}.Add(${item})`;
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
                    return tmpl`${self}.Count`;
                },
            }
        },
        
        OneMap: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneMap`;
            },
        
            methods: {
                keys(self, typeArgs, ...args) {
                    return tmpl`${self}.Keys.ToArray()`;
                },
                
                values(self, typeArgs, ...args) {
                    return tmpl`${self}.Values.ToArray()`;
                },
                
                remove(self, typeArgs, key, ...args) {
                    return tmpl`${self}.Remove(${key})`;
                },
                
                hasKey(self, typeArgs, key, ...args) {
                    return tmpl`${self}.ContainsKey(${key})`;
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
                    return tmpl`File.ReadAllText(${fn})`;
                },
            },
        
            fields: {
                
            }
        }
    },

    operatorGenerators: {
        "OneString + OneBoolean"(left, right, ...args) {
            return tmpl`${this.gen(left)} + (${this.gen(right)} ? "true" : "false")`;
        },
    },

    testGenerator(cls, method, ...args) {
        return tmpl`
            public class Program
            {
                static public void Main()
                {
                    new ${cls}().${method}();
                }
            }`;
    },
    
    main(...args) {
        return tmpl`
            ${tmpl.Block((this.includes||[]).map(inc => tmpl`
                using ${inc};`).join("\n"))}
            
            ${tmpl.Block((this.classes||[]).map(cls => tmpl`
                public class ${cls.name}
                {
                    ${tmpl.Block((cls.fields||[]).map(field => tmpl`
                        ${field.visibility}{space}${tmpl.Block((field.static) ? tmpl`static ` : tmpl``)}${field.type} ${field.name}${tmpl.Block((field.initializer) ? tmpl`{space}= ${this.gen(field.initializer)}` : tmpl``)};`).join("\n"))}
                
                    ${tmpl.Block((cls.constructor) ? tmpl`
                  public ${cls.name}(${this.genArgs(cls.constructor)})
                  {
                      ${this.genBody(cls.constructor.body)}
                  }` : tmpl``)}
                
                    ${tmpl.Block((cls.methods||[]).map(method => tmpl`
                        ${method.visibility}{space}${tmpl.Block((method.static) ? tmpl`static ` : tmpl``)}${method.returnType} ${method.name}(${this.genArgs(method)})
                        {
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
                ${param.type} ${param.name}`).join(", "))}`;
    },
    
    genParams(params, ...args) {
        return tmpl`${tmpl.Block((params||[]).map(param => tmpl`${this.gen(param)}`).join(", "))}`;
    },
    
    genVar(itemVar, ...args) {
        return tmpl`${tmpl.Block((itemVar.isUnused) ? tmpl`// UNUSED: ` : tmpl``)}var ${itemVar.name} = ${this.gen(itemVar.initializer)}`;
    },
})