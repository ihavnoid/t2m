<?php
    $config_path = getenv('T2M_CONFIG') ?: __DIR__."/../config.json";
    $config = json_decode(file_get_contents($config_path));
    function key2val($key) {
        list($v1h, $v1l, $v2h, $v2l) = sscanf($key, "%08x%08x%08x%08x");
        if($v1h >= 0x80000000) {
            $v1h = $v1h - 0x100000000;
        }
        $v1 = $v1h * 0x100000000 + $v1l;

        if($v2h >= 0x80000000) {
            $v2h = $v2h - 0x100000000;
        }
        $v2 = $v2h * 0x100000000 + $v2l;
        return array($v1, $v2);
    }
    function val2key($v1, $v2) {
        return sprintf("%016x%016x", $v1, $v2);
    }
    function timestamp() { // unit: ms
        return intval(microtime(true) * 1000);
    }
	$db = new SQLite3($config->db_path);
    $db->busyTimeout(5000);
	$db->exec('PRAGMA journal_mode = wal;');

    // Migration and Schema Initialization
    $db->exec("CREATE TABLE if not exists contents(id integer primary key, title text, contents text, roid0 integer unique, roid1 integer, rwid0 integer, rwid1 integer, ts integer, seq integer)");
   	$db->exec("CREATE index if not exists roid_index on contents(roid0)");

    // Add last_accessed column if not exists
    $result = $db->query("PRAGMA table_info(contents)");
    $has_last_accessed = false;
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        if ($row['name'] === 'last_accessed') {
            $has_last_accessed = true;
            break;
        }
    }
    if (!$has_last_accessed) {
        $db->exec("BEGIN TRANSACTION;");
        $db->exec("ALTER TABLE contents ADD COLUMN last_accessed INTEGER");
        // Backfill last_accessed with ts for existing rows
        $db->exec("UPDATE contents SET last_accessed = ts");
        $db->exec("COMMIT;");
    }
    
    // Create images tracking table
    $db->exec("CREATE TABLE if not exists images(hash text primary key, created_at integer)");
?>
