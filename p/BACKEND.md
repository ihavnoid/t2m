# Backend Architecture & Garbage Collection Design

This document describes the current backend implementation of the Mindmap application and outlines the strategy for the Garbage Collection (GC) system.

## 1. Current Architecture

The backend is built with PHP and SQLite3. It handles persistent storage for mindmaps and uploaded images.

### 1.1 Core Components
- **`p/common.php`**: Central configuration and database connection handler.
- **`p/n.php`**: Creates a new mindmap with random access keys.
- **`p/r.php`**: Reads a mindmap's contents and metadata.
- **`p/w.php`**: Writes/updates a mindmap's contents.
- **`p/pollpage.php`**: Implements server-sent events for live collaboration.
- **`p/image_upload.php`**: Handles image uploads, conversion to PNG, and deduplication via SHA-256 hashing.

### 1.2 Database Schema
The database (SQLite3) currently consists of a single table: `contents`.

#### Table: `contents`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER (PK) | Internal unique identifier. |
| `title` | TEXT | The title of the mindmap. |
| `contents` | TEXT | Raw HTML content of the editor (contains image tags). |
| `roid0`, `roid1` | INTEGER | Two parts of a 128-bit Read-Only key. |
| `rwid0`, `rwid1` | INTEGER | Two parts of a 128-bit Read-Write key (concatenated with RO keys). |
| `ts` | INTEGER | Timestamp of the last **write** operation (in milliseconds). |
| `seq` | INTEGER | Sequence number for optimistic locking and change tracking. |

### 1.3 Image Storage
- Images are stored as physical files in the `/images/` directory.
- Filename format: `[sha256_hash].png`.
- Images are referenced in `contents.contents` via `<img>` tags with `src="images/[hash].png"`.

---

## 2. Garbage Collection Strategy

The goal is to automatically clean up inactive mindmaps and orphaned images to save storage and maintain performance.

### 2.1 Requirements
1.  **Mindmap Deletion**: Delete any mindmap not accessed (read or written) for a configurable period (default: 2 years).
2.  **Image Deletion**: Delete any image that is **not referenced** by any mindmap and is older than a configurable period (default: 14 days).

### 2.2 Configuration (`config.json`)
The Garbage Collection behavior is controlled by the following fields in `config.json`:

| Field | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `gc_mindmap_ttl_days` | INTEGER | Number of days of inactivity before a mindmap is deleted. | 730 |
| `gc_image_ttl_days` | INTEGER | Number of days an orphaned image is kept before deletion. | 14 |

---

## 3. Required Database Changes

#### A. Tracking Access
Currently, `ts` only tracks the last write. We need a `last_accessed` column to track reads as well.
- **Change**: Add `last_accessed` (INTEGER, ms timestamp) to the `contents` table.
- **Logic**: Update this field in both `p/r.php` (Read) and `p/w.php` (Write).

#### B. Tracking Image Age
To identify images older than `gc_image_ttl_days` without relying solely on filesystem metadata (which can be unreliable during migrations), a dedicated table is recommended.
- **New Table**: `images`
    - `hash` (TEXT PRIMARY KEY): The SHA-256 hash of the image.
    - `created_at` (INTEGER): Timestamp when the image was first uploaded.

---

## 4. Garbage Collection Logic (`p/gc.php`)

The GC script should be executed as a background cron job or periodic task.

#### Phase 1: Mindmap Cleanup
1.  Calculate the mindmap cutoff: `THRESHOLD = NOW() - (config.gc_mindmap_ttl_days * 24 * 60 * 60 * 1000)`.
2.  `DELETE FROM contents WHERE last_accessed < THRESHOLD`.

#### Phase 2: Orphaned Image Cleanup
1.  Calculate the image cutoff: `IMG_THRESHOLD = NOW() - (config.gc_image_ttl_days * 24 * 60 * 60 * 1000)`.
2.  Scan all remaining `contents.contents` to extract all referenced SHA-256 hashes using regex: `images/([a-f0-9]{64})\.png`.
3.  Identify "Old Unreferenced" images:
    - Query `images` table for hashes where `created_at < IMG_THRESHOLD` and `hash` is NOT in the list of referenced hashes.
4.  For each identified image:
    - Delete the physical file `/images/[hash].png`.
    - `DELETE FROM images WHERE hash = ?`.

### 2.4 Implementation Roadmap (Proposed)

1.  **Schema Migration**: Update `p/common.php` or `p/n.php` to add `last_accessed` column and create the `images` table.
2.  **Access Tracking**: Update `p/r.php` and `p/w.php` to maintain `last_accessed`.
3.  **Image Registration**: Update `p/image_upload.php` to register new uploads in the `images` table.
4.  **Legacy Backfill**: Create a one-time script to populate the `images` table from existing files in `/images/` (using file `mtime` as a fallback for `created_at`).
5.  **GC Script**: Implement `p/gc.php` with the logic described above.
