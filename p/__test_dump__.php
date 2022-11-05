<?php
    include "common.php";

    if(php_sapi_name() == "cli") {
    	$db->exec("CREATE TABLE if not exists contents(id integer primary key, title text, contents text, roid0 integer unique, roid1 integer, rwid0 integer, rwid1 integer, ts integer, seq integer)");
    	$db->exec("CREATE index if not exists roid_index on contents(roid0)");
    	
    	$row = $db->query("select * from contents");
    	while($result = $row->fetchArray(SQLITE3_ASSOC)) {
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
    }
?>
