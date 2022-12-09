<?php
    $config = json_decode(file_get_contents(__DIR__."/../config.json"));
    function key2val($key) {
        list($v1h, $v1l, $v2h, $v2l) = sscanf($key, "%08x%08x%08x%08x");
        if($v1h >= 0x80000000) {
            $v1h = $v1h - 0x100000000;
        }
        $v1 = $v1h * 0x100000000 + $v1l;

        if($v2h >= 0x80000000) {
            $v2h = $v2h - 0x100000000;
        }
        $v2 = $v2h * 0x100000000 + $v2l;
        return array($v1, $v2);
    }
    function val2key($v1, $v2) {
        return sprintf("%016x%016x", $v1, $v2);
    }
    function timestamp() { // unit: ms
        return intval(microtime(true) * 1000);
    }
	$db = new SQLite3($config->db_path);
    	$db->busyTimeout(5000);
	$db->exec('PRAGMA journal_mode = wal;');
?>
