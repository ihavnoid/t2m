<?php
    include "common.php";
    if(php_sapi_name() == "cli") {
        $title = $argv[1];
        $contents = $argv[2];
        $key = $argv[3];
    }else {
        $contents = $_POST["contents"];
        $title = $_POST["title"];
        $key = $_POST["k"];
    }

    list($v1,$v2) = key2val(substr($key, 0, 32));
    list($v3,$v4) = key2val(substr($key, 32));
	
	$stmt = $db->prepare("update contents set contents=?, title=?, ts=?, seq=seq+1 where roid0 = ? and roid1 = ? and rwid0 = ? and rwid1 = ?");
	$stmt->bindValue(1, $contents);
	$stmt->bindValue(2, $title);
	$stmt->bindValue(3, timestamp(), SQLITE3_INTEGER);
	$stmt->bindValue(4, $v1, SQLITE3_INTEGER);
	$stmt->bindValue(5, $v2, SQLITE3_INTEGER);
	$stmt->bindValue(6, $v3, SQLITE3_INTEGER);
	$stmt->bindValue(7, $v4, SQLITE3_INTEGER);
	$result = $stmt->execute();
    print($db->changes());
?>
