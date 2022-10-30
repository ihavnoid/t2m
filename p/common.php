<?php
    $config = json_decode(file_get_contents(__DIR__."/../config.json"));
    function key2val($key) {
        list($v1h, $v1l, $v2h, $v2l, $v3h, $v3l, $v4h, $v4l) = sscanf($key, "%08x%08x%08x%08x%08x%08x%08x%08x");
        if($v1h >= 0x80000000) {
            $v1h = $v1h - 0x100000000;
        }
        $v1 = $v1h * 0x100000000 + $v1l;

        if($v2h >= 0x80000000) {
            $v2h = $v2h - 0x100000000;
        }
        $v2 = $v2h * 0x100000000 + $v2l;

        if($v3h >= 0x80000000) {
            $v3h = $v3h - 0x100000000;
        }
        $v3 = $v3h * 0x100000000 + $v3l;

        if($v4h >= 0x80000000) {
            $v4h = $v4h - 0x100000000;
        }
        $v4 = $v4h * 0x100000000 + $v4l;
        return array($v1, $v2, $v3, $v4);
    }
    function val2key($v1, $v2, $v3, $v4) {
        return sprintf("%016x%016x%016x%016x", $v1, $v2, $v3, $v4);
    }
    function timestamp() { // unit: ms
        return intval(microtime(true) * 1000);
    }
	$db = new SQLite3($config->db_path);
?>
