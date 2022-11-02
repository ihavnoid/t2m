<?php
    include "common.php";

    $title = "";
    $contents = "<ul><li></li></ul>";
   	$db->exec("CREATE TABLE if not exists contents(id integer primary key, contents text, roid0 integer unique, roid1 integer, rwid0 integer, rwid1 integer, ts integer, seq integer)");
	
	$stmt = $db->prepare("insert into contents(contents, title, ts, roid0, roid1, rwid0, rwid1, seq) values(?, ?, ?, random(), random(), random(), random(), 1)");
	$stmt->bindValue(1, $contents);
	$stmt->bindValue(2, $title);
	$stmt->bindValue(3, timestamp());
	$stmt->execute();

 	$stmt = $db->prepare("select * from contents where id=?");
    $stmt->bindValue(1, $db->lastInsertRowID());
    $ln = $stmt->execute();
    while($result = $ln->fetchArray(SQLITE3_ASSOC)) {
        $v = array(
            "id" => $result["id"],
            "contents" => $result["contents"],
            "title" => $result["title"],
            "rokey" => val2key($result["roid0"],$result["roid1"]),
            "rwkey" => val2key($result["roid0"],$result["roid1"]).val2key($result["rwid0"],$result["rwid1"]),
            "timestamp" => $result["ts"],
            "seq" => $result["seq"]
        );
        print(json_encode($v)."\n");
    }
    $db->close();
?>
