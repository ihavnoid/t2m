<?php
    include "common.php";

    if(php_sapi_name() == "cli") {
    	$db->exec("CREATE TABLE if not exists contents(id integer primary key, contents text, roid0 integer unique, roid1 integer, rwid0 integer, rwid1 integer, ts integer, seq integer)");
    	
    	$row = $db->query("select * from contents");
    	while($result = $row->fetchArray(SQLITE3_ASSOC)) {
            $v = array(
                    "id" => $result["id"],
                    "contents" => $result["contents"],
                    "rokey" => val2key($result["roid0"],$result["roid1"]),
                    "rwkey" => val2key($result["roid0"],$result["roid1"]).val2key($result["rwid0"],$result["rwid1"]),
                    "timestamp" => $result["ts"],
                    "seq" => $result["seq"]
            );
            print(json_encode($v)."\n");
    	}
    }
?>
