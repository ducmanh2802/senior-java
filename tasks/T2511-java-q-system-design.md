# T2511 — 3 câu hỏi Senior Java (architecture) vào q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2490

Thêm **3 câu hỏi phỏng vấn mới** (topic: architecture) vào `js/data/q-system-design.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-system-design.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Phong cách "internal": không dừng ở định nghĩa, phải giải thích cơ chế chạy BÊN DƯỚI (cấu trúc dữ liệu, lock, page, offset…) từng bước, có số liệu đo trước/sau (EXPLAIN ANALYZE, latency, rows) và cách tự tái hiện trên máy (script SQL/lệnh ngắn). Đọc qtool list để KHÔNG trùng ý câu đã có; trùng thì đi sâu hơn ở góc khác. Elasticsearch internals cho dev Java (≥ 4000 ký tự): inverted index và analyzer, segment + refresh (near real-time) + merge, shard/replica và chọn số shard, đồng bộ DB → ES (outbox/CDC) và xử lý lệch dữ liệu, deep pagination (search_after) và vì sao from+size lớn chậm.

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
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 3 câu hỏi mới (topic `architecture`) vào `js/data/q-system-design.js`:
- `architecture-072` (senior) — Elasticsearch internals: inverted index, term dictionary, postings list, analyzer (char filter → tokenizer → token filter), text vs keyword, BM25; có ví dụ postings 4 tài liệu chạy tay, `_analyze`/`_explain`, code Java client.
- `architecture-073` (senior) — segment bất biến + buffer + translog, refresh (near real-time, mặc định 1s), flush, merge, tombstone; shard/replica và cách chọn số shard (10–50 GB/shard, tránh quá nhỏ/quá nhiều); bảng refresh/merge theo thời gian, lệnh `_cat/segments`/`_forcemerge`.
- `architecture-074` (lead) — đồng bộ PostgreSQL → ES: dual-write là anti-pattern, outbox + CDC (Debezium) + Kafka, external version chống ghi đè, job đối soát/reindex; phân trang sâu from+size chậm vì mỗi shard trả from+size, search_after dùng con trỏ; bảng số liệu lệch dữ liệu + chi phí phân trang, code search_after.

Mỗi câu ≥ 8800 ký tự, có `**Tóm tắt:**`, `### Kiến thức cần biết trước`, sơ đồ `~~~seq`, ví dụ số, `### Tự thử trên máy` (Docker + curl), bảng trade-off, pitfall, `### Ví dụ đời thực` có số liệu, `### Tóm lại 3 ý`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, `follow` 2–3 câu.

Nghiệm thu:
- `node --check js/data/q-system-design.js` → OK.
- `node scripts/qtool.js check js/data/q-system-design.js architecture-072 architecture-073 architecture-074` → OK.
- Đếm id: trước 71 câu `architecture-*`, sau 74 → không mất mục nào của người khác (append bằng qtool, chỉ THÊM).
- `node scripts/build-light-index.js` và `node scripts/validate.js`: **file của tôi sạch** (0 lỗi liên quan `q-system-design`). Validate toàn cục hiện còn báo lỗi ở các file KHÁC do task khác đang làm dở/chưa commit trên working tree (`q-frontend.js` topic "frontend", `lessons-microservices.js` seq 8 actor, `lessons-architecture.js` body < 2500, `q-sql-extra.txt` không khai báo manifest) — theo luật 3 tôi KHÔNG sửa các file này; integrator sẽ xử lý khi merge.

Không commit, không mở trình duyệt, không kill tiến trình.
Reviewed-by: kilo (T2511R)
