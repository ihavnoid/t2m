<?php
    include "common.php";

    if(php_sapi_name() == "cli") {
    	$db->exec("CREATE TABLE if not exists contents(id integer primary key, contents text, roid0 integer, roid1 integer, roid2 integer, roid3 integer, rwid0 integer, rwid1 integer, rwid2 integer, rwid3 integer, ts integer)");
    	
    	$row = $db->query("select * from contents");
    	while($result = $row->fetchArray(SQLITE3_ASSOC)) {
            $v = array(
                    "id" => $result["id"],
                    "contents" => $result["contents"],
                    "rokey" => val2key($result["roid0"],$result["roid1"],$result["roid2"],$result["roid3"]),
                    "rwkey" => val2key($result["rwid0"],$result["rwid1"],$result["rwid2"],$result["rwid3"]),
                    "timestamp" => $result["ts"]
            );
            print(json_encode($v)."\n");
    	}
    }
?>
