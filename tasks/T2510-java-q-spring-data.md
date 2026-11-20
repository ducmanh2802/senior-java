# T2510 — 4 câu hỏi Senior Java (db) vào q-spring-data.js

Status: DONE
Notes: Added db-068..db-071 (Redis internals: event loop/big key, encoding, RDB/AOF+eviction, Cluster hash slots). node --check OK. build-light-index/validate blocked by pre-existing syntax error in q-concurrency-jvm.js (unrelated).
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2502

Thêm **4 câu hỏi phỏng vấn mới** (topic: db) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Phong cách "internal": không dừng ở định nghĩa, phải giải thích cơ chế chạy BÊN DƯỚI (cấu trúc dữ liệu, lock, page, offset…) từng bước, có số liệu đo trước/sau (EXPLAIN ANALYZE, latency, rows) và cách tự tái hiện trên máy (script SQL/lệnh ngắn). Đọc qtool list để KHÔNG trùng ý câu đã có; trùng thì đi sâu hơn ở góc khác. Redis internals: single-thread event loop (vì sao nhanh, vì sao một lệnh KEYS/big key làm treo cả server), encoding của data structure (listpack/skiplist/hashtable), persistence RDB vs AOF, eviction policy, hot key và big key trên production, Redis Cluster hash slot.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Mức giải thích (BẮT BUỘC)## LuậtnNgười học ÍT tiếp xúc công nghệ sâu (chưa từng đọc internals DB## LuậtKafka## LuậtRedis## LuậtES). Mỗi câu## Luậtbài:## Luậtn- Mở đầu "### Kiến thức cần biết trước": giải thích từ gốc các thuật ngữ sẽ dùng (page, B+tree, transaction, offset, partition, shard…) bằng lời đơn giản + ví dụ đời thường (ví dụ: index như mục lục sách).## Luậtn- Đi TỪNG BƯỚC, mỗi bước 1 ý, có sơ đồ ASCII hoặc ~~~seq minh hoạ dữ liệu thay đổi thế nào.## Luậtn- Có 1 ví dụ số cụ thể chạy tay được (bảng 10 dòng, 2 transaction A## LuậtB theo thời gian t1, t2…).## Luậtn- Có "### Tự thử trên máy": lệnh SQL## Luậtredis-cli## Luậtkafka CLI ngắn + Docker 1 dòng để tái hiện, kèm kết quả mong đợi.## Luậtn- Kết bằng "### Tóm lại 3 ý" trước Senior tip.## LuậtnĐộ dài được phép 5000–8000 ký tự.## Luậtn
## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Reviewed-by: kilo (T2510R)
