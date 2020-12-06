using System;
using System.Threading.Tasks;
using Generator;
using Test;

namespace CSharp
{
    class Program
    {
        static async Task Main(string[] args)
        {
            await new TestRunner("../../", args).runTests();
        }
    }
}
