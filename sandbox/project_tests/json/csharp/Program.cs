using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace JsonTest
{
    class Program
    {
        static void Main(string[] args)
        {
            var obj = JObject.Parse("{'name':'value'}");
            Console.WriteLine($"value = {obj["name"]}");
        }
    }
}
