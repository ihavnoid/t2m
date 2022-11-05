<?php
include "common.php";

if(php_sapi_name() == "cli") {
    $key = $argv[1];
} else {
    $key = $_GET["k"];
    header("Content-Type: text/event-stream");
}

list($v1,$v2) = key2val(substr($key, 0, 32));

$stmt = $db->prepare("select seq from contents where roid0 = ? and roid1 = ? and seq > ?");
$seq = 0;

try {
    for($i=0; $i<3600; $i++) {
        error_log("0");
        $stmt->bindValue(3, $seq, SQLITE3_INTEGER);
        $stmt->bindValue(1, $v1, SQLITE3_INTEGER);
        $stmt->bindValue(2, $v2, SQLITE3_INTEGER);
        $row = $stmt->execute();
        error_log("1");
        while($result = $row->fetchArray(SQLITE3_ASSOC)) {
            error_log("2");
            $seq = $result["seq"];
            error_log("3");
            print("data:".$result["seq"]."\n\n");
            error_log("4");
            while(ob_get_level() > 0) {
                ob_end_flush();
            }
            error_log("5");
            flush();
        }
        error_log("6");
        
        if(connection_aborted()) break;
        error_log("7");
        sleep(1);
    }
} finally {
    $db->close();
}
?>
