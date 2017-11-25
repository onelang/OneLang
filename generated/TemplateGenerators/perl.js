({
    expressionGenerators: {
        Call(expr, ...args) {
            return tmpl`${this.gen(expr.method)}(${tmpl.Block((expr.arguments||[]).map(arg => tmpl`${this.gen(arg)}`).join(", "))})`;
        },
        
        PropertyAccess(expr, ...args) {
            return tmpl`${this.gen(expr.object)}->${this.gen(expr.propertyName)}`;
        },
        
        Identifier(expr, ...args) {
            return tmpl`\$${expr.text}`;
        },
        
        StringLiteral(expr, ...args) {
            return tmpl`"${expr.escapedText}"`;
        },
        
        CharacterLiteral(expr, ...args) {
            return tmpl`"${expr.escapedText}"`;
        },
        
        NullLiteral(expr, ...args) {
            return tmpl`undef`;
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
            return tmpl`(${this.genParams(expr.items)})`;
        },
        
        MapLiteral(expr, ...args) {
            return tmpl`
                (
                  ${tmpl.Block((expr.properties||[]).map(prop => tmpl`
                      ${prop.name} => ${this.gen(prop.initializer)},`).join("\n"))}
                )`;
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
            return tmpl`${this.varName(expr.varRef, args[0])}`;
        },
        
        MethodArgument(expr, ...args) {
            return tmpl`${this.varName(expr.varRef)}`;
        },
        
        InstanceField(expr, ...args) {
            return tmpl`${this.gen(expr.thisExpr)}->{${expr.varRef.name}}`;
        },
        
        StaticField(expr, ...args) {
            return tmpl`\$${this.gen(expr.thisExpr)}::${expr.varRef.name}`;
        },
        
        TrueLiteral(expr, ...args) {
            return tmpl`1`;
        },
        
        FalseLiteral(expr, ...args) {
            return tmpl`0`;
        },
        
        ElementAccess(expr, ...args) {
            return tmpl`${this.gen(expr.object, true)}{${this.gen(expr.elementExpr)}}`;
        },
        
        ThisReference(expr, ...args) {
            return tmpl`\$self`;
        },
        
        Conditional(expr, ...args) {
            return tmpl`${this.gen(expr.condition)} ? ${this.gen(expr.whenTrue)} : ${this.gen(expr.whenFalse)}`;
        },
        
        Break(expr, ...args) {
            return tmpl`last;`;
        },
        
        TemplateString(expr, ...args) {
            return tmpl`
                "${tmpl.Block((expr.parts||[]).map(part => tmpl`${tmpl.Block((part.literal) ? tmpl`${part.text}` : tmpl`${tmpl.Block((part.expr.valueType.isBoolean) ? tmpl`@{[(${this.gen(part.expr)}) ? 'true' : 'false']}` : tmpl`
                    @{[${this.gen(part.expr)}]}`)}`)}`).join(""))}"`;
        },
        
        Foreach(expr, ...args) {
            return tmpl`
                foreach my \$${expr.itemVariable.name} (${this.gen(expr.items)}) {
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
                    {space}els${this.genBody(expr.else)}
                  ` : tmpl`
                    {space}else {
                    {space}   ${this.genBody(expr.else)}
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
                    return tmpl`substr ${self}, ${start}, (${end} - ${start})`;
                },
                
                split(self, typeArgs, separator, ...args) {
                    return tmpl`split(${separator}, ${self})`;
                },
                
                get(self, typeArgs, idx, ...args) {
                    return tmpl`substr ${self}, ${idx}, 1`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`length(${self})`;
                },
            }
        },
        
        OneConsole: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneConsole`;
            },
        
            methods: {
                print(self, typeArgs, str, ...args) {
                    return tmpl`print((${str}) . "\\n")`;
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
                    return tmpl`push ${self}, ${item}`;
                },
                
                get(self, typeArgs, index, ...args) {
                    return tmpl`${this.hackPerlToVar(self)}[${index}]`;
                },
                
                set(self, typeArgs, index, value, ...args) {
                    return tmpl`${this.hackPerlToVar(self)}[${index}] = ${value}`;
                },
            },
        
            fields: {
                length(self, typeArgs, ...args) {
                    return tmpl`scalar(${self})`;
                },
            }
        },
        
        OneMap: {
            typeGenerator(typeArgs, ...args) {
                return tmpl`OneMap`;
            },
        
            methods: {
                keys(self, typeArgs, ...args) {
                    return tmpl`keys ${self}`;
                },
                
                values(self, typeArgs, ...args) {
                    return tmpl`values ${self}`;
                },
                
                remove(self, typeArgs, key, ...args) {
                    return tmpl`delete ${this.hackPerlToVar(self)}{${key}}`;
                },
                
                hasKey(self, typeArgs, key, ...args) {
                    return tmpl`exists ${this.hackPerlToVar(self)}{${key}}`;
                },
                
                get(self, typeArgs, key, ...args) {
                    return tmpl`${this.hackPerlToVar(self)}{${key}}`;
                },
                
                set(self, typeArgs, key, value, ...args) {
                    return tmpl`${this.hackPerlToVar(self)}{${key}} = ${value}`;
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
                        open my \$fh, '<', ${fn} or die "Can't open file \$!";
                        read \$fh, my \$${result}, -s \$fh;
                        close(\$fh);`;
                },
            },
        
            fields: {
                
            }
        }
    },

    operatorGenerators: {
        "OneString + OneString"(left, right, ...args) {
            return tmpl`${this.gen(left)} . ${this.gen(right)}`;
        },
        
        "OneString <= OneCharacter"(left, right, ...args) {
            return tmpl`${this.gen(left)} le ${this.gen(right)}`;
        },
        
        "OneCharacter <= OneString"(left, right, ...args) {
            return tmpl`${this.gen(left)} le ${this.gen(right)}`;
        },
        
        "OneCharacter <= OneCharacter"(left, right, ...args) {
            return tmpl`${this.gen(left)} le ${this.gen(right)}`;
        },
        
        "OneString >= OneCharacter"(left, right, ...args) {
            return tmpl`${this.gen(left)} gt ${this.gen(right)}`;
        },
        
        "OneCharacter >= OneString"(left, right, ...args) {
            return tmpl`${this.gen(left)} gt ${this.gen(right)}`;
        },
        
        "OneCharacter >= OneCharacter"(left, right, ...args) {
            return tmpl`${this.gen(left)} gt ${this.gen(right)}`;
        },
        
        "OneString + OneNumber"(left, right, ...args) {
            return tmpl`${this.gen(left)} . ${this.gen(right)}`;
        },
        
        "OneString + OneBoolean"(left, right, ...args) {
            return tmpl`${this.gen(left)} . ((${this.gen(right)}) ? "true" : "false")`;
        },
        
        "OneString + OneCharacter"(left, right, ...args) {
            return tmpl`${this.gen(left)} . ${this.gen(right)}`;
        },
        
        "OneString += OneString"(left, right, ...args) {
            return tmpl`${this.gen(left)} .= ${this.gen(right)}`;
        },
        
        "OneString += OneCharacter"(left, right, ...args) {
            return tmpl`${this.gen(left)} .= ${this.gen(right)}`;
        },
    },

    testGenerator(cls, method, ...args) {
        return tmpl`
            package Program;
            my \$c = new ${cls}();
            \$c->${method}();`;
    },
    
    main(...args) {
        return tmpl`
            use strict;
            use warnings;
            
            ${tmpl.Block((this.classes||[]).map(cls => tmpl`
                package ${cls.name};
                
                sub new
                {
                    my \$class = shift;
                    my \$self = {};
                    bless \$self, \$class;
                    ${tmpl.Block((cls.constructor) ? tmpl`
                  my ( ${tmpl.Block((cls.constructor.parameters||[]).map(param => tmpl`\$${param.name}`).join(","))} ) = @_;
                  ${this.genBody(cls.constructor.body)}` : tmpl``)}
                    return \$self;
                }
                
                ${tmpl.Block((cls.fields||[]).map(field => tmpl`
                    ${tmpl.Block((field.static) ? tmpl`
                          our \$${field.name}${tmpl.Block((field.initializer) ? tmpl`{space}= ${this.gen(field.initializer)}` : tmpl``)};` : tmpl``)}`).join("\n"))}
                
                ${tmpl.Block((cls.methods||[]).map(method => tmpl`
                    sub ${method.name} {
                        my ( \$self${tmpl.Block((method.parameters||[]).map(param => tmpl`, \$${param.name}`).join(""))} ) = @_;
                        ${this.genBody(method.body)}
                    }`).join("\n\n"))}`).join("\n\n"))}`;
    },
    
    genBody(body, ...args) {
        return tmpl`
            ${tmpl.Block((body.statements||[]).map(statement => tmpl`
                ${statement.leadingTrivia2}${this.gen(statement)}`).join("\n"))}`;
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
        return tmpl`my ${this.varName(itemVar)} = ${this.gen(itemVar.initializer)}`;
    },
    
    varName(item, asVar, ...args) {
        return tmpl`${tmpl.Block((item.type.isOneMap&&!asVar) ? tmpl`%` : tmpl`${tmpl.Block((item.type.isOneArray&&!asVar) ? tmpl`@` : tmpl`\$`)}`)}${item.name}`;
    },
})