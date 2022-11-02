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

    if(strlen($key) > 32) {
        list($v1,$v2) = key2val(substr($key, 0, 32));
        list($v3,$v4) = key2val(substr($key, 32));
    	
    	$stmt = $db->prepare("select * from contents where ts > ? and roid0 = ? and roid1 = ? and rwid0 = ? and rwid1 = ?");
    	$stmt->bindValue(1, $ts, SQLITE3_INTEGER);
    	$stmt->bindValue(2, $v1, SQLITE3_INTEGER);
    	$stmt->bindValue(3, $v2, SQLITE3_INTEGER);
    	$stmt->bindValue(4, $v3, SQLITE3_INTEGER);
    	$stmt->bindValue(5, $v4, SQLITE3_INTEGER);
    	$row = $stmt->execute();
    	while($result = $row->fetchArray(SQLITE3_ASSOC)) {
            $v = array(
                    "id" => $result["id"],
                    "title" => $result["title"],
                    "contents" => $result["contents"],
                    "rokey" => val2key($result["roid0"],$result["roid1"]),
                    "rwkey" => val2key($result["roid0"],$result["roid1"]).val2key($result["rwid0"],$result["rwid1"]),
                    "timestamp" => $result["ts"],
                    "seq" => $result["seq"],
                    "lockdelay" => $result["ts"] + 20000 - timestamp()
            );
            print(json_encode($v)."\n");
            $db->close();
            exit(0);
    	}
    } else {
        list($v1,$v2) = key2val($key);
    	
    	$stmt = $db->prepare("select * from contents where ts > ? and roid0 = ? and roid1 = ?");
    	$stmt->bindValue(1, $ts, SQLITE3_INTEGER);
    	$stmt->bindValue(2, $v1, SQLITE3_INTEGER);
    	$stmt->bindValue(3, $v2, SQLITE3_INTEGER);
    	$row = $stmt->execute();
    	while($result = $row->fetchArray(SQLITE3_ASSOC)) {
            $v = array(
                    "id" => $result["id"],
                    "title" => $result["title"],
                    "contents" => $result["contents"],
                    "rokey" => val2key($result["roid0"],$result["roid1"]),
                    "timestamp" => $result["ts"],
                    "seq" => $result["seq"],
                    "lockdelay" => $result["ts"] + 20000 - timestamp()
            );
            print(json_encode($v)."\n");
            $db->close();
            exit(0);
    	}
    }
    print("{}");
    $db->close();
?>
