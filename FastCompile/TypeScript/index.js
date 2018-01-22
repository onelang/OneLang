const process = require("process");
const http = require("http");
const vm = require("vm");
const ts = require("typescript");
const util = require("util");

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = [];
        request.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            const bodyBuffer = Buffer.concat(body);
            resolve(bodyBuffer);
        });
    });
}

function log(...args) {
    console.log('[TypeScript]', ...args);
}

function requireFromString(src, filename) {
    var Module = module.constructor;
    var m = new Module();
    m._compile(src, filename);
    return m.exports;
}

function tsCompile(code) {
    return ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
}

const server = http.createServer(async (request, response) => {
    function resp(result) {
        result["backendVersion"] = "one:tsjs:server:20180122";
        response.end(JSON.stringify(result));
    }

    try {
        response.setHeader("Access-Control-Allow-Origin", "*");

        const origin = request.headers.origin||"<null>";
        if (origin !== "https://ide.onelang.io" && !origin.startsWith("http://127.0.0.1:")) {
            resp({ exceptionText: `Origin is not allowed: ${origin}`, errorCode: "origin_not_allowed" });
            return;
        }
    
        const requestText = (await readRequestBody(request)).toString();
        const requestJson = JSON.parse(requestText);
        
        let code = requestJson.code;
        let stdlibCode = requestJson.stdlibCode;
        if (requestJson.lang === "TypeScript") {
            code = tsCompile(code);
            stdlibCode = tsCompile(stdlibCode);
        }

        let result = "";
        const script = new vm.Script(code);
        const context = new vm.createContext({ 
            console: {
                log: (...args) => result += (util.format(...args) + '\n'),
            },
            require: (...args) => {
                if (args[0] === 'one')
                    return requireFromString(stdlibCode, 'one.js');
                else                    
                    return require(...args);
            }
        });

        const startTime = process.hrtime();
        script.runInContext(context);
        const elapsedTime = process.hrtime(startTime);
        const elapsedMs = elapsedTime[0] * 1000 + Math.round(elapsedTime[1] / 1e6);

        resp({ result, elapsedMs });
    } catch(e) {
        resp({ exceptionText: `${e}\n\n${e.stack}` });
    }
});

const port = process.argv.length > 2 ? parseInt(process.argv[2]) : 8002;
server.listen(port, '127.0.0.1', (err) => {
    if (err)
        log('something bad happened', err);
    else
        log(`server is listening on ${port}`);
});

var stdin = process.openStdin();
stdin.addListener("data", function(data) {
    log(`Stopping after user input...`);
    process.exit();
});