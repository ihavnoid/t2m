<?php
include "common.php";

if(php_sapi_name() == "cli") {
    $key = $argv[1];
} else {
    $key = $_GET["k"];

    // nginx
    header("X-Accel-Buffering: no");
    header("Content-Type: text/event-stream");
}

list($v1,$v2) = key2val(substr($key, 0, 32));

$stmt = $db->prepare("select seq from contents where roid0 = ? and roid1 = ? and seq > ?");
$seq = 0;

try {
    for($i=0; $i<120; $i++) {
        $stmt->bindValue(3, $seq, SQLITE3_INTEGER);
        $stmt->bindValue(1, $v1, SQLITE3_INTEGER);
        $stmt->bindValue(2, $v2, SQLITE3_INTEGER);
        $row = $stmt->execute();
        while($result = $row->fetchArray(SQLITE3_ASSOC)) {
            $seq = $result["seq"];
            print("data:".$result["seq"]."\n\n");
            while(ob_get_level() > 0) {
                ob_end_flush();
            }
            flush();
        }
        
        if(connection_aborted()) break;
        sleep(1);
    }
} finally {
    $db->close();
}
?>
