<?php
header("Access-Control-Allow-Origin: http://127.0.0.1:8000");
try {
    $postdata = json_decode(file_get_contents("php://input"), true);
    
    $code = str_replace(array("<?php", "?>"), "", $postdata["code"]);
    $className = $postdata["className"];
    $methodName = $postdata["methodName"];
    $code .= "\n \$c = new $className(); return \$c->$methodName();";
    
    $startTime = microtime(true);
    $result = eval($code);
    $elapsedMs = (int)((microtime(true) - $startTime) * 1000);
    print json_encode(array("result" => $result, "elapsedMs" => $elapsedMs));
} catch(Exception $e) {
    print json_encode(array("exceptionText" => $e->getTraceAsString()));
}
