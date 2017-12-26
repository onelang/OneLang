<?php

function exception_error_handler($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, $errno, 0, $errfile, $errline);
}

set_error_handler("exception_error_handler");

function fatal_handler() {
    $errfile = "unknown file";
    $errstr  = "shutdown";
    $errno   = E_CORE_ERROR;
    $errline = 0;

    $error = error_get_last();

    if($error !== NULL) {
        $errno   = $error["type"];
        $errfile = $error["file"];
        $errline = $error["line"];
        $errstr  = $error["message"];

        $result = ob_get_clean();
        print json_encode(array("result" => $result, "exceptionText" => "line #{$errline}: {$errstr}"));
    }
}

register_shutdown_function("fatal_handler");

header("Access-Control-Allow-Origin: *");
try {
    $postdata = json_decode(file_get_contents("php://input"), true);
    
    $code = str_replace(array("<?php", "?>"), "", $postdata["code"]);
    $stdlibCode = str_replace(array("<?php", "?>"), "", $postdata["stdlibCode"]);
    $className = $postdata["className"];
    $methodName = $postdata["methodName"];
    
    ob_start();
    $startTime = microtime(true);
    eval($stdlibCode);
    eval($code);
    $elapsedMs = (int)((microtime(true) - $startTime) * 1000);
    $result = ob_get_clean();
    print json_encode(array("result" => $result, "elapsedMs" => $elapsedMs));
} catch(Exception $e) {
    $result = ob_get_clean();
    print json_encode(array("result" => $result, "exceptionText" => "line #{$e->getLine()}: {$e->getMessage()}\n{$e->getTraceAsString()}"));
}
