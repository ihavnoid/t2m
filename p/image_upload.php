<?php
header('Content-Type: application/json');

// Ensure the images directory exists
$targetDir = __DIR__ . "/../images/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// Get the raw POST data
$json = file_get_contents('php://input');
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

// Create an image resource from the binary data
$src = imagecreatefromstring($binaryData);
if ($src === false) {
    echo json_encode(['error' => 'Failed to create image from data']);
    exit;
}

// Calculate the SHA-256 hash of the binary data
$hash = hash('sha256', $binaryData);
$filename = $hash . '.png';
$targetFile = $targetDir . $filename;

// Convert/Save as PNG
if (imagepng($src, $targetFile)) {
    imagedestroy($src);
    
    // Always return a relative path for migration safety
    $relativeUrl = "images/" . $filename;
    
    echo json_encode([
        'success' => true,
        'url' => $relativeUrl,
        'hash' => $hash
    ]);
} else {
    imagedestroy($src);
    echo json_encode(['error' => 'Failed to save image file']);
}
?>
