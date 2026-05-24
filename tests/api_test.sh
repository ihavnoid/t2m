#!/bin/bash
set -e

BASE_URL="http://localhost:8080"

echo "Testing p/n.php (Create new mindmap)..."
NEW_RESPONSE=$(curl -s -X POST "$BASE_URL/p/n.php")
echo "$NEW_RESPONSE" | jq .

ROKEY=$(echo "$NEW_RESPONSE" | jq -r .rokey)
RWKEY=$(echo "$NEW_RESPONSE" | jq -r .rwkey)
ID=$(echo "$NEW_RESPONSE" | jq -r .id)

if [ -z "$RWKEY" ]; then
    echo "Failed to get RWKEY"
    exit 1
fi

echo "Testing p/w.php (Write content)..."
WRITE_RESPONSE=$(curl -s -X POST "$BASE_URL/p/w.php" \
    -d "k=$RWKEY" \
    -d "title=TestTitle" \
    -d "contents=TestContents" \
    -d "sync=0" \
    -d "seq=1")

if [ "$WRITE_RESPONSE" != "1" ]; then
    echo "Failed to write content: $WRITE_RESPONSE"
    exit 1
fi
echo "Write successful."

echo "Testing p/r.php (Read content with RWKEY)..."
READ_RESPONSE=$(curl -s -X POST "$BASE_URL/p/r.php" \
    -d "k=$RWKEY" \
    -d "ts=0")
echo "$READ_RESPONSE" | jq .

READ_TITLE=$(echo "$READ_RESPONSE" | jq -r .title)
READ_CONTENTS=$(echo "$READ_RESPONSE" | jq -r .contents)

if [ "$READ_TITLE" != "TestTitle" ] || [ "$READ_CONTENTS" != "TestContents" ]; then
    echo "Read content mismatch!"
    exit 1
fi
echo "Read successful (RWKEY)."

echo "Testing p/r.php (Read content with ROKEY)..."
READ_RO_RESPONSE=$(curl -s -X POST "$BASE_URL/p/r.php" \
    -d "k=$ROKEY" \
    -d "ts=0")
echo "$READ_RO_RESPONSE" | jq .

READ_RO_TITLE=$(echo "$READ_RO_RESPONSE" | jq -r .title)
if [ "$READ_RO_TITLE" != "TestTitle" ]; then
    echo "Read (RO) title mismatch!"
    exit 1
fi
echo "Read successful (ROKEY)."

echo "All API tests passed!"
