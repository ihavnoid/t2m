<?php
    include "common.php";
	$db->exec("CREATE TABLE if not exists contents(id integer primary key, contents text, roid0 integer, roid1 integer, roid2 integer, roid3 integer, rwid0 integer, rwid1 integer, rwid2 integer, rwid3 integer, ts integer)");
	
	$stmt = $db->prepare("insert into contents(contents, ts, roid0, roid1, roid2, roid3, rwid0, rwid1, rwid2, rwid3) values(?, ?, random(), random(), random(), random(), random(), random(), random(), random())");
	$stmt->bindValue(1, "");
	$stmt->bindValue(2, timestamp());
	$stmt->execute();

 	$stmt = $db->prepare("select * from contents where id=?");
    $stmt->bindValue(1, $db->lastInsertRowID());
    $ln = $stmt->execute();
    while($result = $ln->fetchArray(SQLITE3_ASSOC)) {
        $v = array(
            "id" => $result["id"],
            "contents" => $result["contents"],
            "rokey" => val2key($result["roid0"],$result["roid1"],$result["roid2"],$result["roid3"]),
            "rwkey" => val2key($result["rwid0"],$result["rwid1"],$result["rwid2"],$result["rwid3"]),
            "timestamp" => $result["ts"]
        );
        print(json_encode($v)."\n");
    }
?>
