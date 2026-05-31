import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync, spawnSync } from "child_process";
import fs from "fs";

const TEST_DB = "tests/test_backend.db";
const TEST_CONFIG = "tests/test_config.json";
const PHP_CMD = `T2M_CONFIG=${TEST_CONFIG} php`;

describe("Backend Core API", () => {
    beforeAll(() => {
        if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
        if (!fs.existsSync("images"))
            fs.mkdirSync("images", { recursive: true });
    });

    afterAll(() => {
        if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    });

    let rokey, rwkey;

    it("p/n.php should create a new mindmap", () => {
        const output = execSync(`${PHP_CMD} p/n.php`).toString();
        const res = JSON.parse(output);
        expect(res).toHaveProperty("id");
        expect(res).toHaveProperty("rokey");
        expect(res).toHaveProperty("rwkey");
        rokey = res.rokey;
        rwkey = res.rwkey;
    });

    it("p/w.php should write content", () => {
        const title = "TestTitle";
        const contents = "TestContents";
        const output = execSync(
            `${PHP_CMD} p/w.php "${title}" "${contents}" "${rwkey}"`,
        ).toString();
        expect(output.trim()).toBe("1");
    });

    it("p/r.php should read content with RWKEY", () => {
        const output = execSync(`${PHP_CMD} p/r.php 0 "${rwkey}"`).toString();
        const res = JSON.parse(output);
        expect(res.title).toBe("TestTitle");
        expect(res.contents).toBe("TestContents");
    });

    it("p/r.php should read content with ROKEY", () => {
        const output = execSync(`${PHP_CMD} p/r.php 0 "${rokey}"`).toString();
        const res = JSON.parse(output);
        expect(res.title).toBe("TestTitle");
        expect(res).not.toHaveProperty("rwkey");
    });

    it("p/image_upload.php should handle uploads", () => {
        const mockImage =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        const payload = JSON.stringify({ image: mockImage });

        const res = spawnSync("php", ["p/image_upload.php"], {
            input: payload,
            env: { ...process.env, T2M_CONFIG: TEST_CONFIG },
        });

        const output = res.stdout.toString();
        const json = JSON.parse(output);
        expect(json.success).toBe(true);
        expect(json.url).toMatch(/^images\/[a-f0-9]{64}\.png$/);

        const filePath = json.url;
        expect(fs.existsSync(filePath)).toBe(true);
    });

    describe("Garbage Collection (p/gc.php)", () => {
        const MS_PER_DAY = 24 * 60 * 60 * 1000;

        it("should delete mindmaps older than gc_mindmap_ttl_days", () => {
            const now = Date.now();
            const oldTs = now - 731 * MS_PER_DAY; // 731 days ago (TTL is 730)

            // Insert an old mindmap directly via PHP
            spawnSync(
                "php",
                [
                    "-r",
                    `
                include "p/common.php";
                $stmt = $db->prepare("INSERT INTO contents(title, contents, roid0, roid1, rwid0, rwid1, ts, last_accessed, seq) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->bindValue(1, "Old Map");
                $stmt->bindValue(2, "Old Content");
                $stmt->bindValue(3, 1111);
                $stmt->bindValue(4, 2222);
                $stmt->bindValue(5, 3333);
                $stmt->bindValue(6, 4444);
                $stmt->bindValue(7, ${oldTs});
                $stmt->bindValue(8, ${oldTs});
                $stmt->bindValue(9, 1);
                $stmt->execute();
            `,
                ],
                { env: { ...process.env, T2M_CONFIG: TEST_CONFIG } },
            );

            // Run GC
            const gcOutput = execSync(`${PHP_CMD} p/gc.php`).toString();
            expect(gcOutput).toContain("Deleted 1 inactive mindmaps");

            // Verify it is gone
            const checkRes = spawnSync(
                "php",
                [
                    "-r",
                    `
                include "p/common.php";
                $res = $db->query("SELECT count(*) as cnt FROM contents WHERE title='Old Map'");
                echo $res->fetchArray()["cnt"];
            `,
                ],
                { env: { ...process.env, T2M_CONFIG: TEST_CONFIG } },
            );
            expect(checkRes.stdout.toString().trim()).toBe("0");
        });

        it("should delete orphaned images older than gc_image_ttl_days", () => {
            const now = Date.now();
            const oldTs = now - 15 * MS_PER_DAY; // 15 days ago (TTL is 14)
            const recentTs = now - 5 * MS_PER_DAY;

            const oldHash = "a".repeat(64);
            const recentHash = "b".repeat(64);
            const referencedHash = "c".repeat(64);

            // Create dummy files
            if (!fs.existsSync("images")) fs.mkdirSync("images");
            fs.writeFileSync(`images/${oldHash}.png`, "old");
            fs.writeFileSync(`images/${recentHash}.png`, "recent");
            fs.writeFileSync(`images/${referencedHash}.png`, "referenced");

            // Register in DB
            spawnSync(
                "php",
                [
                    "-r",
                    `
                include "p/common.php";
                $db->exec("INSERT INTO images(hash, created_at) VALUES('${oldHash}', ${oldTs})");
                $db->exec("INSERT INTO images(hash, created_at) VALUES('${recentHash}', ${recentTs})");
                $db->exec("INSERT INTO images(hash, created_at) VALUES('${referencedHash}', ${oldTs})");
                
                // Create a mindmap referencing referencedHash
                $stmt = $db->prepare("INSERT INTO contents(title, contents, roid0, roid1, rwid0, rwid1, ts, last_accessed, seq) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->bindValue(1, "Ref Map");
                $stmt->bindValue(2, "Here is an image: images/${referencedHash}.png");
                $stmt->bindValue(3, 555);
                $stmt->bindValue(4, 666);
                $stmt->bindValue(5, 777);
                $stmt->bindValue(6, 888);
                $stmt->bindValue(7, ${now});
                $stmt->bindValue(8, ${now});
                $stmt->bindValue(9, 1);
                $stmt->execute();
            `,
                ],
                { env: { ...process.env, T2M_CONFIG: TEST_CONFIG } },
            );

            // Run GC
            const gcOutput = execSync(`${PHP_CMD} p/gc.php`).toString();
            expect(gcOutput).toContain("Deleted 1 orphaned images");

            // Verify files
            expect(fs.existsSync(`images/${oldHash}.png`)).toBe(false);
            expect(fs.existsSync(`images/${recentHash}.png`)).toBe(true); // Orphan but too recent
            expect(fs.existsSync(`images/${referencedHash}.png`)).toBe(true); // Old but referenced

            // Cleanup dummy files
            if (fs.existsSync(`images/${recentHash}.png`))
                fs.unlinkSync(`images/${recentHash}.png`);
            if (fs.existsSync(`images/${referencedHash}.png`))
                fs.unlinkSync(`images/${referencedHash}.png`);
        });
    });
});
