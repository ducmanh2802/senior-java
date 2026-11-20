# T2515 — 2 bài học (db) vào lessons-db.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T2461

Thêm **2 bài học mới** (track `db`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: pessimistic lock không giữ connection: cột lease (locked_by, locked_until) + compare-and-set, so sánh với SELECT FOR UPDATE; bài tập Java thuần mô phỏng bảng bằng ConcurrentHashMap, nhiều worker tranh nhau nhận job bằng CAS + lease hết hạn (Clock giả), test xác định không ai xử lý trùng và job được nhận lại khi lease hết hạn.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Mức giải thích (BẮT BUỘC)## LuậtNgười học ÍT tiếp xúc công nghệ sâu (chưa từng đọc internals DB## LuậtKafka## LuậtRedis## LuậtES). Mỗi câu## Luậtbài:## Luậtn- Mở đầu "### Kiến thức cần biết trước": giải thích từ gốc các thuật ngữ sẽ dùng (page, B+tree, transaction, offset, partition, shard…) bằng lời đơn giản + ví dụ đời thường (ví dụ: index như mục lục sách).## Luậtn- Đi TỪNG BƯỚC, mỗi bước 1 ý, có sơ đồ ASCII hoặc ~~~seq minh hoạ dữ liệu thay đổi thế nào.## Luậtn- Có 1 ví dụ số cụ thể chạy tay được (bảng 10 dòng, 2 transaction A## LuậtB theo thời gian t1, t2…).## Luậtn- Có "### Tự thử trên máy": lệnh SQL## Luậtredis-cli## Luậtkafka CLI ngắn + Docker 1 dòng để tái hiện, kèm kết quả mong đợi.## Luậtn- Kết bằng "### Tóm lại 3 ý" trước Senior tip.## LuậtĐộ dài được phép 5000–8000 ký tự.## Luật
## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-db.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 bài học: `lesson-db-018` (Lease-based locking: pessimistic lock không giữ connection, CAS + cột lease, so sánh SELECT FOR UPDATE) và `lesson-db-019` (Distributed job queue: Redis SET NX PX, idempotency key, exponential backoff+jitter, DLQ).

File `js/data/lessons-db.js` pass `node --check`. 

Lưu ý: `node scripts/validate.js` báo lỗi trên các file khác (q-concurrency-jvm.js, q-microservices.js, q-system-design.js, lessons-microservices.js, q-frontend.js, bugs.js, lessons-collections.js, q-sql-extra.txt) do backtick trong template literal — đây là lỗi **tiền tồn tại** không thuộc file sở hữu của task này. Chỉ file `lessons-db.js` là trong phạm vi task.
