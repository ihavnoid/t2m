<?php
    include "common.php";
    if(php_sapi_name() == "cli") {
        $ts = $argv[1];
        $key = $argv[2];
    }else {
        if(array_key_exists("ts", $_POST)) {
            $ts = $_POST["ts"];
        } else {
            $ts = 0;
        }
        $key = $_POST["k"];
    }

    list($v1,$v2,$v3,$v4) = key2val($key);
	
	$stmt = $db->prepare("select * from contents where ts > ? and roid0 = ? and roid1 = ? and roid2 = ? and roid3 = ?");
	$stmt->bindValue(1, $ts, SQLITE3_INTEGER);
	$stmt->bindValue(2, $v1, SQLITE3_INTEGER);
	$stmt->bindValue(3, $v2, SQLITE3_INTEGER);
	$stmt->bindValue(4, $v3, SQLITE3_INTEGER);
	$stmt->bindValue(5, $v4, SQLITE3_INTEGER);
	$row = $stmt->execute();
	while($result = $row->fetchArray(SQLITE3_ASSOC)) {
        $v = array(
                "id" => $result["id"],
                "contents" => $result["contents"],
                "rokey" => val2key($result["roid0"],$result["roid1"],$result["roid2"],$result["roid3"]),
                "timestamp" => $result["ts"]
        );
        print(json_encode($v)."\n");
        exit(0);
	}
    
    print("{}");
?>
