<?php

header("Access-Control-Allow-Origin: *");

function resp($result) {
    $result["backendVersion"] = "one:php:server:20180122";
    print json_encode($result);
    exit;
}

$origin = isset($_SERVER["HTTP_ORIGIN"]) ? $_SERVER["HTTP_ORIGIN"] : "<null>";
if ($origin !== "https://ide.onelang.io" && strpos($origin, "http://127.0.0.1:") !== 0) {
    resp(array("exceptionText" => "Origin is not allowed: " . $origin, "errorCode" => "origin_not_allowed"));
}

function exception_error_handler($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, $errno, 0, $errfile, $errline);
}

set_error_handler("exception_error_handler");

function fatal_handler() {
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

try {
    $postdata = json_decode(file_get_contents("php://input"), true);
    
    $code = str_replace(array("<?php", "?>", 'require_once("one.php");'), "", $postdata["code"]);
    $stdlibCode = str_replace(array("<?php", "?>"), "", $postdata["stdlibCode"]);
    $className = $postdata["className"];
    $methodName = $postdata["methodName"];
    
    ob_start();
    $startTime = microtime(true);
    eval($stdlibCode);
    eval($code);
    $elapsedMs = (int)((microtime(true) - $startTime) * 1000);
    $result = ob_get_clean();
    resp(array("result" => $result, "elapsedMs" => $elapsedMs));
} catch(Error $e) {
    $result = ob_get_clean();
    resp(array("result" => $result, "exceptionText" => "line #{$e->getLine()}: {$e->getMessage()}\n{$e->getTraceAsString()}"));
} catch(Exception $e) {
    $result = ob_get_clean();
    resp(array("result" => $result, "exceptionText" => "line #{$e->getLine()}: {$e->getMessage()}\n{$e->getTraceAsString()}"));
}
