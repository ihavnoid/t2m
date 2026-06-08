<?php
// tests/test_backend_integrity.php

$db_path = __DIR__ . "/../test_temp.db";
$config_path = __DIR__ . "/../config.json";

// 1. Setup temporary database and config
if (file_exists($db_path)) unlink($db_path);

$config_data = [
    "db_path" => $db_path
];
file_put_contents($config_path, json_encode($config_data));

// 2. Create the test database with schema
$db = new SQLite3($db_path);
$db->exec("CREATE TABLE contents(id integer primary key, title text, contents text, roid0 integer unique, roid1 integer, rwid0 integer, rwid1 integer, ts integer, seq integer)");

// 3. Insert initial record
$v1 = 1; $v2 = 2; $v3 = 3; $v4 = 4;
$full_key = sprintf("%016x%016x%016x%016x", $v1, $v2, $v3, $v4);
$db->exec("INSERT INTO contents (title, contents, roid0, roid1, rwid0, rwid1, ts, seq) VALUES ('Initial', 'Original Content', $v1, $v2, $v3, $v4, " . time() . ", 1)");

echo "--- Setup Complete ---\n";

// 4. Test Case: Successful Update (Using CLI mode of p/w.php)
echo "Testing Success with correct seq (via manual DB update for testing simplicity)...\n";
$cmd = "php p/w.php " . escapeshellarg("Updated") . " " . escapeshellarg("New Content") . " " . escapeshellarg($full_key);
exec($cmd, $output, $return);

$res = $db->querySingle("SELECT title FROM contents WHERE roid0=$v1");
if ($res === "Updated") {
    echo "SUCCESS: Title updated.\n";
} else {
    echo "FAILURE: Title update failed. Result: $res\n";
}

// 5. Test Case: Optimistic Locking (Using a simulated Web request)
echo "Testing Failure with incorrect seq (Optimistic Locking)...\n";

$test_sim_content = <<<'EOD'
<?php
putenv('T2M_CONFIG=' . __DIR__ . '/../config.json');
require_once 'p/common.php';

// Prime the DB with a specific seq
$db->exec("UPDATE contents SET seq = 10 WHERE roid0 = 1");

// Simulate $_POST for web request
$_POST["title"] = "Failed Update";
$_POST["contents"] = "Stale Content";
$_POST["k"] = "0000000000000001000000000000000200000000000000030000000000000004"; // v1=1, v2=2...
$_POST["seq"] = "1"; // This is the OLD seq. The DB has 10.

require_once 'p/w.php';

// If optimistic locking worked, changes() should be 0 because seq mismatch
echo $db->changes();
?>
EOD;

file_put_contents("test_sim.php", $test_sim_content);
$changes = shell_exec("php test_sim.php");
$changes = trim($changes);

if ($changes === "0") {
    echo "SUCCESS: Optimistic locking prevented stale update (Changes: $changes).\n";
else {
    echo "FAILURE: Optimistic locking failed! Changes detected: $changes\n";
}

// 6. Test Case: Access Tracking
echo "Testing Access Tracking...\n";
$last_access = $db->querySingle("SELECT last_accessed FROM contents WHERE roid0=$v1");
if ($last_access !== null && $last_access > 0) {
    echo "SUCCESS: last_accessed updated (Value: $last_access).\n";
} else {
    echo "FAILURE: last_accessed not updated or invalid.\n";
}

// Cleanup
$db->close();
unlink($db_path);
unlink("test_sim.php");
unlink($config_path);
echo "--- Testing Finished ---\n";
?>

EOD;

file_put_contents("test_sim.php", $test_sim_content);
$changes = shell_exec("php test_sim.php");
$changes = trim($changes);

if ($changes === "0") {
    echo "SUCCESS: Optimistic locking prevented stale update (Changes: $changes).\n";
} else {
    echo "FAILURE: Optimistic locking failed! Changes detected: $changes\n";
}

// 6. Test Case: Access Tracking
echo "Testing Access Tracking...\n";
$last_access = $db->querySingle("SELECT last_accessed FROM contents WHERE roid0=$v1");
if ($last_access !== null && $last_access > 0) {
    echo "SUCCESS: last_accessed updated (Value: $last_access).\n";
} else {
    echo "FAILURE: last_accessed not updated or invalid.\n";
}

// Cleanup
$db->close();
unlink($db_path);
unlink("test_sim.php");
unlink($config_path);
echo "--- Testing Finished ---\n";
?>

EOD;

file_put_contents("test_sim.php", $test_sim_content);
$changes = shell_exec("php test_sim.php");
$changes = trim($changes);

if ($changes === "0") {
    echo "SUCCESS: Optimistic locking prevented stale update (Changes: $changes).\n";
} else {
    echo "FAILURE: Optimistic locking failed! Changes detected: $changes\n";
}

// 6. Test Case: Access Tracking
echo "Testing Access Tracking...\n";
$last_access = $db->querySingle("SELECT last_accessed FROM contents WHERE roid0=$v1");
if ($last_access !== null && $last_access > 0) {
    echo "SUCCESS: last_accessed updated (Value: $last_access).\n";
} else {
    echo "FAILURE: last_accessed not updated or invalid.\n";
}

// Cleanup
$db->close();
unlink($db_path);
unlink("test_sim.php");
unlink($config_path);
echo "--- Testing Finished ---\n";
?>
