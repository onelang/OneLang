package one

import "strings"
import "regexp"
import "reflect"

func Regex_MatchFromIndex(pattern string, input string, offset int) []string {
	reader := strings.NewReader(input)
	reader.Seek(int64(offset), 0)

	re := regexp.MustCompile("^" + pattern)
	matchIndices := re.FindReaderSubmatchIndex(reader)

	if matchIndices == nil {
		return nil
	}

	groupCount := len(matchIndices) / 2
	result := make([]string, groupCount)		
    for i := 0; i < groupCount; i++ {
        result[i] = input[offset + matchIndices[i * 2 + 0] : offset + matchIndices[i * 2 + 1]]
    }

    return result
}

//===------------------ REFLECTION ------------------===//

var ReflectClasses = map[string]*Class{}

func Reflect_GetRealType(obj interface{}) reflect.Type {
	typeObj := reflect.TypeOf(obj)
	for typeObj.Kind() == reflect.Ptr {
		typeObj = typeObj.Elem()
	}
	return typeObj
}

func nameKey(name string) string {
	return strings.ToLower(strings.Replace(name, "_", "", -1))
}

func Reflect_SetupClass(obj interface{}, fields []*Field, methods []*Method) {
	classType := Reflect_GetRealType(obj)
	
	oneClass := new(Class)
	oneClass.Name = classType.Name()
	oneClass.Type = classType

	oneClass.Fields = make(map[string]*Field)
	for _, field := range fields {
		if (!field.IsStatic) {
			insField, _ := classType.FieldByName(field.Name)
			field.StructField = &insField
		}

		oneClass.Fields[nameKey(field.Name)] = field
	}

	oneClass.Methods = make(map[string]*Method)
	for _, method := range methods {
		if (!method.IsStatic) {
			insMethod, _ := classType.MethodByName(method.Name)
			method.InstanceMethod = &insMethod
		}

		oneClass.Methods[nameKey(method.Name)] = method
	}

	ReflectClasses[nameKey(oneClass.Name)] = oneClass
}

func Reflect_GetClass(obj interface{}) *Class {
	return Reflect_GetClassByName(Reflect_GetRealType(obj).Name())
}

func Reflect_GetClassByName(name string) *Class {
	return ReflectClasses[nameKey(name)]
}

func Reflect_InstanceMethod(name string) *Method {
	return &Method{name, false, nil, reflect.Value{}}
}

func Reflect_StaticMethod(name string, obj interface{}) *Method {
	return &Method{name, true, nil, reflect.ValueOf(obj)}
}

func Reflect_InstanceField(name string) *Field {
	return &Field{name, false, nil, reflect.Value{}}
}

func Reflect_StaticField(name string, obj interface{}) *Field {
	return &Field{name, true, nil, reflect.ValueOf(obj).Elem()}
}

type Class struct {
	Name string
	Type reflect.Type
	Fields map[string]*Field
	Methods map[string]*Method
}

func (this *Class) GetMethod(name string) *Method {
	return this.Methods[nameKey(name)]
}

func (this *Class) GetField(name string) *Field {
	return this.Fields[nameKey(name)]
}

type Field struct {
	Name string
	IsStatic bool
	StructField *reflect.StructField
	StaticField reflect.Value
}

func (this *Field) GetFieldRef(obj interface{}) reflect.Value {
	if this.IsStatic {
		return this.StaticField
	} else {
		return reflect.ValueOf(obj).Elem().FieldByIndex(this.StructField.Index)
	}
}

func (this *Field) GetValue(obj interface{}) interface{} {
	return this.GetFieldRef(obj).Interface()
}

func (this *Field) SetValue(obj interface{}, value interface{}) {
	this.GetFieldRef(obj).Set(reflect.ValueOf(value))
}

type Method struct {
	Name string
	IsStatic bool
	InstanceMethod *reflect.Method
	StaticMethod reflect.Value
}

func (this *Method) Call(obj interface{}, args []interface{}) interface{} {
	inArgs := make([]reflect.Value, len(args))
	for i, arg := range args {
		inArgs[i] = reflect.ValueOf(arg)
	}

	var methodRef reflect.Value
	if (this.IsStatic) {
		methodRef = this.StaticMethod
	} else {
		methodRef = reflect.ValueOf(obj).Method(this.InstanceMethod.Index)
	}
	return methodRef.Call(inArgs)[0].Interface()
}
