<?php
header('Content-Type: application/json');

// Ensure the images directory exists
$targetDir = __DIR__ . "/../images/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// Get the raw POST data or STDIN if CLI
if (php_sapi_name() == "cli") {
    $json = file_get_contents('php://stdin');
} else {
    $json = file_get_contents('php://input');
}
$data = json_decode($json, true);

if (!isset($data['image'])) {
    echo json_encode(['error' => 'No image data provided']);
    exit;
}

$base64Data = $data['image'];

// Remove the data URL prefix if present
if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
    $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
    $type = strtolower($type[1]); // jpg, png, gif
} else {
    // If no prefix, assume it might be raw base64 or invalid
    $type = 'png'; 
}

$binaryData = base64_decode($base64Data);
if ($binaryData === false) {
    echo json_encode(['error' => 'Invalid base64 data']);
    exit;
}

// Calculate the SHA-256 hash of the binary data
$hash = hash('sha256', $binaryData);
$filename = $hash . '.png';
$targetFile = $targetDir . $filename;

$saved = false;
if (function_exists('imagecreatefromstring')) {
    // Create an image resource from the binary data
    $src = imagecreatefromstring($binaryData);
    if ($src !== false) {
        // Convert/Save as PNG
        if (imagepng($src, $targetFile)) {
            imagedestroy($src);
            $saved = true;
        } else {
            imagedestroy($src);
        }
    }
}

// Fallback: just save the raw binary data if GD failed or is missing
if (!$saved) {
    if (file_put_contents($targetFile, $binaryData)) {
        $saved = true;
    }
}

if ($saved) {
    // Register image in DB for GC tracking
    include_once "common.php";
    $stmt = $db->prepare("INSERT OR IGNORE INTO images(hash, created_at) VALUES(?, ?)");
    $stmt->bindValue(1, $hash);
    $stmt->bindValue(2, timestamp());
    $stmt->execute();
    $db->close();

    // Always return a relative path for migration safety
    $relativeUrl = "images/" . $filename;
    
    echo json_encode([
        'success' => true,
        'url' => $relativeUrl,
        'hash' => $hash
    ]);
} else {
    echo json_encode(['error' => 'Failed to save image file']);
}
?>
