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
            return tmpl`new ArrayList<${expr.typeArgs[0]}>(Arrays.asList(${this.genParams(expr.items)}))`;
        },
        
        MapLiteralDeclaration(expr, ...args) {
            return tmpl`
                HashMap<${this.typeName(expr.initializer.valueType.typeArguments[0])}, ${this.typeName(expr.initializer.valueType.typeArguments[1])}> ${expr.name} = new HashMap<${this.typeName(expr.initializer.valueType.typeArguments[0])}, ${this.typeName(expr.initializer.valueType.typeArguments[1])}>();
                ${tmpl.Block((expr.initializer.properties||[]).map(prop => tmpl`
                    ${expr.name}.put("${prop.name}", ${this.gen(prop.initializer)});`).join("\n"))}`;
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
            return tmpl`${this.gen(expr.object)}.get(${this.gen(expr.elementExpr)})`;
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
                ${tmpl.Block((expr.parts||[]).map(part => tmpl`${tmpl.Block((part.literal) ? tmpl`"${part.text}"` : tmpl`
                    ${this.gen(part.expr)}`)}`).join(" + "))}`;
        },
        
        Foreach(expr, ...args) {
            return tmpl`
                for (${this.typeName(expr.itemVariable.type)} ${expr.itemVariable.name} : ${this.gen(expr.items)}) {
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
        OneCharacter: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`char`;
            },
        
            methods: {
                
            },
        
            fields: {
                
            }
        },
        
        OneString: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`String`;
            },
        
            methods: {
                substring(self, typeArgs, start, end, ...args) {
                    return tmpl`${self}.substring(${start}, ${end})`;
                },
                
                split(self, typeArgs, separator, ...args) {
                    return tmpl`Arrays.asList(${self}.split(${separator}))`;
                },
                
                get(self, typeArgs, idx, ...args) {
                    return tmpl`${self}.charAt(${idx})`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`${self}.length()`;
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
                return tmpl`boolean`;
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
                    return tmpl`System.out.println(${str})`;
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
                    return tmpl`${self}.add(${item})`;
                },
                
                get(self, typeArgs, index, ...args) {
                    return tmpl`${self}.get(${index})`;
                },
                
                set(self, typeArgs, index, value, ...args) {
                    return tmpl`${self}.set(${index}], ${value})`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`${self}.size()`;
                },
            }
        },
        
        OneMap: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`HashMap<${typeArgs[0]}, ${typeArgs[1]}>`;
            },
        
            methods: {
                keys(self, typeArgs, ...args) {
                    return tmpl`new ArrayList(${self}.keySet())`;
                },
                
                values(self, typeArgs, ...args) {
                    return tmpl`new ArrayList(${self}.values())`;
                },
                
                remove(self, typeArgs, key, ...args) {
                    return tmpl`${self}.remove(${key})`;
                },
                
                hasKey(self, typeArgs, key, ...args) {
                    return tmpl`${self}.containsKey(${key})`;
                },
                
                get(self, typeArgs, key, ...args) {
                    return tmpl`${self}.get(${key})`;
                },
                
                set(self, typeArgs, key, value, ...args) {
                    return tmpl`${self}.put(${key}, ${value})`;
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
                    return tmpl`new String(Files.readAllBytes(Paths.get(${fn})));`;
                },
            },
        
            fields: {
                
            }
        }
    },

    operatorGenerators: {
        
    },

    testGenerator(cls, method, ...args) {
        return tmpl`
            class Program {
                public static void main(String[] args) throws Exception {
                    new ${cls}().${method}();
                }
            }`;
    },
    
    main(...args) {
        return tmpl`
            ${tmpl.Block((this.includes||[]).map(inc => tmpl`
                import ${inc};`).join("\n"))}
            
            ${tmpl.Block((this.classes||[]).map(cls => tmpl`
                class ${cls.name} {
                    ${tmpl.Block((cls.fields||[]).map(field => tmpl`
                        ${field.visibility}{space}${tmpl.Block((field.static) ? tmpl`static ` : tmpl``)}${field.type} ${field.name}${tmpl.Block((field.initializer) ? tmpl`{space}= ${this.gen(field.initializer)}` : tmpl``)};`).join("\n"))}
                
                    ${tmpl.Block((cls.constructor) ? tmpl`
                  public ${cls.name}(${this.genArgs(cls.constructor)}) {
                      ${this.genBody(cls.constructor.body)}
                  }` : tmpl``)}
                
                    ${tmpl.Block((cls.methods||[]).map(method => tmpl`
                          ${method.visibility}{space}${tmpl.Block((method.static) ? tmpl`static ` : tmpl``)}${method.returnType} ${method.name}(${this.genArgs(method)}) throws Exception
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
        return tmpl`${this.typeName(itemVar.type)} ${itemVar.name} = ${this.gen(itemVar.initializer)}`;
    },
})