# T2519 — 2 bài học (db) vào lessons-db.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T2515

Thêm **2 bài học mới** (track `db`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: TỪ SỐ 0 — Redis bên trong: Redis là gì, vì sao lưu trong RAM nhanh, single thread xử lý lệnh lần lượt (vì sao 1 lệnh chậm làm treo tất cả), các kiểu dữ liệu và dùng cho bài toán gì (string đếm, hash, sorted set bảng xếp hạng), TTL và eviction, persistence; bài tập Java thuần: tự cài mini key-value store 1 thread xử lý hàng đợi lệnh (BlockingQueue), có TTL (Clock giả) và INCR atomic, test xác định.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Mức giải thích (BẮT BUỘC)## LuậtnNgười học ÍT tiếp xúc công nghệ sâu. Bài học viết như dạy người CHƯA BIẾT GÌ: ví dụ đời thường trước, thuật ngữ sau; từng bước một ý; sơ đồ ASCII## Luật~~~seq minh hoạ; ví dụ số chạy tay; mục "### Tự thử trên máy" (Docker 1 dòng + lệnh + kết quả mong đợi); kết bằng "### Tóm lại 3 ý" rồi "### Liên hệ phỏng vấn". body 4000–8000 ký tự.## Luậtn
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
Đã thêm 2 bài học:
- lesson-db-018 (order 18): Redis bên trong — RAM, single-threaded event loop, data types, TTL, eviction, persistence (RDB/AOF)
- lesson-db-019 (order 19): Mini key-value store — BlockingQueue worker, fake Clock, INCR atomic, deterministic tests
Reviewed-by: kilo (T2519R)
