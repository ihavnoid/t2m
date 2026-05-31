<?php
/**
 * Garbage Collection Script for t2m
 * 
 * Logic:
 * 1. Delete mindmaps not accessed for gc_mindmap_ttl_days.
 * 2. Delete images not referenced in any mindmap and older than gc_image_ttl_days.
 */

include "common.php";

$mindmap_ttl_days = isset($config->gc_mindmap_ttl_days) ? $config->gc_mindmap_ttl_days : 730;
$image_ttl_days = isset($config->gc_image_ttl_days) ? $config->gc_image_ttl_days : 14;

$now = timestamp();
$mindmap_threshold = $now - ($mindmap_ttl_days * 24 * 60 * 60 * 1000);
$image_threshold = $now - ($image_ttl_days * 24 * 60 * 60 * 1000);

echo "Starting Garbage Collection...\n";
echo "Mindmap TTL: $mindmap_ttl_days days (Threshold: $mindmap_threshold)\n";
echo "Image TTL: $image_ttl_days days (Threshold: $image_threshold)\n";

// --- Phase 1: Mindmap Cleanup ---
$stmt = $db->prepare("DELETE FROM contents WHERE last_accessed < ?");
$stmt->bindValue(1, $mindmap_threshold, SQLITE3_INTEGER);
$stmt->execute();
$deleted_mindmaps = $db->changes();
echo "Deleted $deleted_mindmaps inactive mindmaps.\n";

// --- Phase 2: Identify Referenced Images ---
$referenced_hashes = [];
$res = $db->query("SELECT contents FROM contents");
while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
    // Regex to find images/HASH.png
    if (preg_match_all('/images\/([a-f0-9]{64})\.png/i', $row['contents'], $matches)) {
        foreach ($matches[1] as $hash) {
            $referenced_hashes[$hash] = true;
        }
    }
}
echo "Found " . count($referenced_hashes) . " unique referenced image hashes.\n";

// --- Phase 3: Orphaned Image Cleanup ---
$stmt = $db->prepare("SELECT hash FROM images WHERE created_at < ?");
$stmt->bindValue(1, $image_threshold, SQLITE3_INTEGER);
$res = $stmt->execute();

$deleted_images_count = 0;
while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
    $hash = $row['hash'];
    if (!isset($referenced_hashes[$hash])) {
        // Orphan and old!
        $file_path = __DIR__ . "/../images/" . $hash . ".png";
        if (file_exists($file_path)) {
            if (unlink($file_path)) {
                echo "Deleted orphaned image file: $hash.png\n";
            } else {
                echo "Failed to delete image file: $hash.png\n";
            }
        }
        
        // Remove from DB
        $db->exec("DELETE FROM images WHERE hash = '$hash'");
        $deleted_images_count++;
    }
}

echo "Deleted $deleted_images_count orphaned images.\n";
echo "Garbage Collection complete.\n";

$db->close();
?>
