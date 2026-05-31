<?php
    include "common.php";

    $title = "";
    $contents = "<ul><li></li></ul>";
    $db->exec("CREATE TABLE if not exists contents(id integer primary key, title text, contents text, roid0 integer unique, roid1 integer, rwid0 integer, rwid1 integer, ts integer, seq integer)");
   	$db->exec("CREATE index if not exists roid_index on contents(roid0)");

    // Add last_accessed column if not exists
    $db->exec("BEGIN TRANSACTION;");
    $result = $db->query("PRAGMA table_info(contents)");
    $has_last_accessed = false;
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        if ($row['name'] === 'last_accessed') {
            $has_last_accessed = true;
            break;
        }
    }
    if (!$has_last_accessed) {
        $db->exec("ALTER TABLE contents ADD COLUMN last_accessed INTEGER");
        // Backfill last_accessed with ts for existing rows
        $db->exec("UPDATE contents SET last_accessed = ts");
    }
    
    // Create images tracking table
    $db->exec("CREATE TABLE if not exists images(hash text primary key, created_at integer)");
    $db->exec("COMMIT;");
	
	$stmt = $db->prepare("insert into contents(contents, title, ts, last_accessed, roid0, roid1, rwid0, rwid1, seq) values(?, ?, ?, ?, random(), random(), random(), random(), 1)");
	$stmt->bindValue(1, $contents);
	$stmt->bindValue(2, $title);
	$now = timestamp();
	$stmt->bindValue(3, $now);
    $stmt->bindValue(4, $now);
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
