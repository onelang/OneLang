const process = require("process");
const http = require("http");
const vm = require("vm");
const ts = require("typescript");

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

const server = http.createServer(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    try {
        const requestText = (await readRequestBody(request)).toString();
        const requestJson = JSON.parse(requestText);
        //log(request.url, requestJson);
        
        let code = requestJson.code;
        if (requestJson.lang === "TypeScript")
            code = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

        //log("code", code);

        const startTime = process.hrtime();
        
        const script = new vm.Script(code + `\n new ${requestJson.className}().${requestJson.methodName}()`);
        const context = new vm.createContext({ });
        const result = script.runInContext(context);

        const elapsedTime = process.hrtime(startTime);
        const elapsedMs = elapsedTime[0] * 1000 + Math.round(elapsedTime[1] / 1e6);

        response.end(JSON.stringify({ result, elapsedMs }));
    } catch(e) {
        //console.error(e);
        response.end(JSON.stringify({ exceptionText: `${e}\n\n${e.stack}` }));
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