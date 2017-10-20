<?php
function exception_error_handler($errno, $errstr, $errfile, $errline ) {
    throw new ErrorException($errstr, $errno, 0, $errfile, $errline);
}
set_error_handler("exception_error_handler");

header("Access-Control-Allow-Origin: *");
try {
    $postdata = json_decode(file_get_contents("php://input"), true);
    
    $code = str_replace(array("<?php", "?>"), "", $postdata["code"]);
    $className = $postdata["className"];
    $methodName = $postdata["methodName"];
    
    ob_start();
    $startTime = microtime(true);
    eval($code);
    $elapsedMs = (int)((microtime(true) - $startTime) * 1000);
    $result = ob_get_clean();
    print json_encode(array("result" => $result, "elapsedMs" => $elapsedMs));
} catch(Exception $e) {
    print json_encode(array("exceptionText" => "line #{$e->getLine()}: {$e->getMessage()}\n{$e->getTraceAsString()}"));
}
