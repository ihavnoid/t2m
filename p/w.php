<?php
    include "common.php";
    $seq = 0;
    if(php_sapi_name() == "cli") {
        $title = $argv[1];
        $contents = $argv[2];
        $key = $argv[3];
        $sync = 0;
    }else {
        $contents = $_POST["contents"];
        $title = $_POST["title"];
        $key = $_POST["k"];
        $sync= $_POST["sync"];
        if(array_key_exists("seq", $_POST)) {
            $seq = $_POST["seq"];
        }
    }

    list($v1,$v2) = key2val(substr($key, 0, 32));
    list($v3,$v4) = key2val(substr($key, 32));
	
    if($seq > 0) {
    	$stmt = $db->prepare("update contents set contents=?, title=?, ts=?, seq=seq+1 where roid0 = ? and roid1 = ? and rwid0 = ? and rwid1 = ? and seq = ?");
    	$stmt->bindValue(8, $seq, SQLITE3_INTEGER);
    } else {
	    $stmt = $db->prepare("update contents set contents=?, title=?, ts=?, seq=seq+1 where roid0 = ? and roid1 = ? and rwid0 = ? and rwid1 = ?");
    }
	$stmt->bindValue(1, $contents);
	$stmt->bindValue(2, $title);
    if($sync > 0) {
    	$stmt->bindValue(3, timestamp()-20000, SQLITE3_INTEGER);
    } else {
    	$stmt->bindValue(3, timestamp(), SQLITE3_INTEGER);
    }
	$stmt->bindValue(4, $v1, SQLITE3_INTEGER);
	$stmt->bindValue(5, $v2, SQLITE3_INTEGER);
	$stmt->bindValue(6, $v3, SQLITE3_INTEGER);
	$stmt->bindValue(7, $v4, SQLITE3_INTEGER);
	$result = $stmt->execute();
    print($db->changes());
    $db->close();
?>
