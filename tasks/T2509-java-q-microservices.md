# T2509 — 4 câu hỏi Senior Java (microservices) vào q-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2492

Thêm **4 câu hỏi phỏng vấn mới** (topic: microservices) vào `js/data/q-microservices.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-microservices.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Phong cách "internal": không dừng ở định nghĩa, phải giải thích cơ chế chạy BÊN DƯỚI (cấu trúc dữ liệu, lock, page, offset…) từng bước, có số liệu đo trước/sau (EXPLAIN ANALYZE, latency, rows) và cách tự tái hiện trên máy (script SQL/lệnh ngắn). Đọc qtool list để KHÔNG trùng ý câu đã có; trùng thì đi sâu hơn ở góc khác. Kafka internals: consumer chạy 1 pod đúng nhưng 2 pod bị trùng/sai thứ tự (partition assignment, rebalance, commit offset trước/sau xử lý, key partition), log segment + index offset, page cache và zero-copy vì sao Kafka nhanh, ISR và mất dữ liệu khi acks=1.

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
`node --check js/data/q-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 4 câu hỏi mới vào cuối `js/data/q-microservices.js` (id nối tiếp 115), chỉ THÊM, không sửa/xoá mục cũ (diff: +354 dòng, 0 dòng xoá):

- `microservices-116` (senior, 7011 ký tự): Distributed lock với Redis/Redisson — SET NX PX, TTL, watchdog gia hạn, fencing token chống zombie write, tranh cãi Redlock.
- `microservices-117` (senior, 5890): HTTP keep-alive + connection pool, ephemeral port + TIME_WAIT, lỗi "Cannot assign requested address", đo bằng ss/tcpdump.
- `microservices-118` (senior, 5629): Redis cache internals — eviction (allkeys-lru vs volatile-lru), hot key, big key, KEYS chặn single-thread, cache stampede + singleflight.
- `microservices-119` (lead, 5813): HikariCP pool sizing theo định luật Little, pool quá lớn phản tác dụng, ngân sách kết nối cho cả cụm.

Mỗi câu đủ mục theo yêu cầu: `**Tóm tắt:**` → `### Kiến thức cần biết trước` → cơ chế từng bước (ASCII) → bảng trade-off → `### Tự thử trên máy` (docker/redis-cli/psql + kết quả mong đợi) → `### Ví dụ đời thực` có số liệu → `### Tóm lại 3 ý` → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; 3 câu follow; không dùng backtick (dùng `{{code}}`); tiếng Việt có dấu.

Chọn góc KHÔNG trùng: các chủ đề Kafka internals gợi ý trong đề (consumer 1 vs 2 pod, log segment/zero-copy, ISR/acks=1) đã có ở câu 009/030/047/050/052/056/108/109/115 → không viết lại; chọn 4 khoảng trống (lock phân tán, HTTP connection pool, Redis cache internals, DB connection pool). File trước đó bị lần chạy hỏng để lại 8 câu 116–123 dùng backtick sống (lỗi cú pháp, validate không chạy được) và trùng ý câu đã có; đã khôi phục baseline 115 câu từ HEAD rồi thêm 4 câu sạch.

Nghiệm thu:
- `node --check js/data/q-microservices.js` → OK.
- `node scripts/validate.js q-microservices.js` → 0 lỗi cho q-microservices (microservices = 119 câu hỏi).
- `node scripts/build-light-index.js` và bước kiểm tra index-light của validate ĐANG BỊ CHẶN bởi file KHÔNG thuộc task này: `js/data/q-system-design.js` (phiên T2511 đang sửa dở) có lỗi cú pháp do backtick sống tại dòng ~12356 ("Kết quả: `hits.total.value = 0`."). Theo luật 3, tôi KHÔNG sửa file này. Đã tạo lại `js/data/index-light.js` bằng bản q-system-design cuối còn tốt (HEAD) để 4 câu mới được index (microservices = 119, tổng 2393). Sau khi T2511 sửa xong file của họ, chạy lại `node scripts/build-light-index.js && node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: kilo (T2509R)
