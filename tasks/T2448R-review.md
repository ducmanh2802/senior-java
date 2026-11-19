# T2448R — Fact-check nội dung mới của T2448

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2448 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 5 câu hỏi mới (db-059 đến db-063) trong `js/data/q-spring-data.js`:
- db-059: Redis data types, rate limit (INCR+EXPIRE), leaderboard (Sorted Set), distributed lock (SET NX PX + Lua), Redlock rủi ro (clock skew, GC pause, failover), fencing token — **đúng kỹ thuật**
- db-060: Cache-aside vs write-through, cache stampede (thundering herd), giải pháp single-flight/probabilistic early expiration/lock per key — **đúng kỹ thuật**
- db-061: MongoDB vs RDBMS, document model, index, multi-document transaction (4.0 replica set, 4.2 sharded), giới hạn cross-shard — **đúng kỹ thuật**
- db-062: Redis eviction policy (noeviction, allkeys-lru, volatile-lru, allkeys-lfu, volatile-ttl), TTL, maxmemory, monitor (evicted_keys, fragmentation) — **đúng kỹ thuật**
- db-063: Redis Cluster vs Sentinel, 16384 hash slot, failover per shard, multi-key chỉ cùng slot, hash tag — **đúng kỹ thuật**

Markup: dùng `{{code}}`, `###`, `-`, `|` table, `> Senior tip:` — **đúng chuẩn**. Không có chữ nước ngoài lẫn vào (tiếng Việt + thuật ngữ tiếng Anh).
Chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK (lỗi hiện tại là file lessons-spring.js có sẵn, không thuộc task này).
**Không có lỗi kiến thức, không cần sửa nội dung.**
