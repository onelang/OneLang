using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Emit;
using System.Diagnostics;
using Newtonsoft.Json;
using System.Text.RegularExpressions;

namespace OneCSharpCompiler
{
    public class Program
    {
        class Request
        {
            [JsonProperty("code")]
            public string Code { get; set; }

            [JsonProperty("stdlibCode")]
            public string StdLibCode { get; set; }
        }

        class Response
        {
            [JsonProperty("exceptionText")]
            public string ExceptionText { get; set; }

            [JsonProperty("errorCode")]
            public string ErrorCode { get; set; }

            [JsonProperty("result")]
            public string Result { get; set; }

            [JsonProperty("backendVersion")]
            public string BackendVersion { get; set; }
        }

        static MetadataReference[] references;

        static Response Process(Request request)
        {
            var codeAst = CSharpSyntaxTree.ParseText(request.Code);
            var stdlibAst = CSharpSyntaxTree.ParseText(request.StdLibCode);
            var compilation = CSharpCompilation.Create(Path.GetRandomFileName(), new[] { codeAst, stdlibAst }, references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

            using (var ms = new MemoryStream())
            {
                EmitResult compileResult = compilation.Emit(ms);

                if (!compileResult.Success)
                {
                    var errors = compileResult.Diagnostics.Where(f => f.IsWarningAsError || f.Severity == DiagnosticSeverity.Error).ToArray();
                    return new Response
                    {
                        ExceptionText = String.Join("\n", errors.Select(x => $"[{x.Id}] {x.GetMessage()}")),
                        ErrorCode = "compilation_error",
                    };
                }
                else
                {
                    var originalStdOut = Console.Out;
                    try
                    {
                        var sw = new StringWriter();
                        Console.SetOut(sw);

                        ms.Seek(0, SeekOrigin.Begin);
                        AssemblyLoadContext.Default.LoadFromStream(ms).GetType("Program").GetMethod("Main").Invoke(null, new object[] { new string[0] });
                        return new Response { Result = sw.ToString() };
                    }
                    catch (Exception e)
                    {
                        return new Response { ErrorCode = "runtime_error", ExceptionText = e.ToString() };
                    }
                    finally
                    {
                        Console.SetOut(originalStdOut);
                    }
                }
            }
        }

        public static void Main()
        {
            references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")).Split(Path.PathSeparator)
                .Select(x => MetadataReference.CreateFromFile(x)).ToArray();

            while (true)
            {
                var requestLine = Console.ReadLine();
                if (requestLine == null) break;

                Response response;
                try
                {
                    var request = JsonConvert.DeserializeObject<Request>(requestLine);
                    response = Process(request);
                }
                catch (Exception e)
                {
                    response = new Response { ErrorCode = "invalid_request", ExceptionText = e.ToString() };
                }

                response.BackendVersion = "one:csharp:jsonrepl:20180122";
                var responseJson = JsonConvert.SerializeObject(response);
                Console.WriteLine(responseJson);
            }
        }
    }
}
