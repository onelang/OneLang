<?php

class MapTestClass {
    function mapTest() {
        $map_obj = array(
          "x" => 5,
        );
        //let containsX = "x" in mapObj;
        //delete mapObj["x"];
        $map_obj["x"] = 3;
        return $map_obj["x"];
    }
}