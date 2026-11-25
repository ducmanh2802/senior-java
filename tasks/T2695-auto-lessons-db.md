# T2695 — 2 bài học (db) vào lessons-db.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T2621

Thêm **2 bài học mới** (track `db`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Isolation level và các hiện tượng (dirty read, non-repeatable read, phantom, lost update) — bài tập mô phỏng 2 transaction trên bảng giả để thấy lost update và cách sửa bằng khoá/compare-and-set; (2) Index B-tree hoạt động thế nào — bài tập tìm kiếm khoảng trên mảng đã sắp xếp và so sánh số bước với quét toàn bộ.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm (chỉ JDK chuẩn, Java 17, không class public ngoài Main), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/lessons-db.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã THÊM 2 bài học (giữ nguyên toàn bộ 21 bài cũ, không sửa mục nào):
  - `lesson-db-022` (order 22, senior, 30') — "Lost update và hai cách chặn: pessimistic lock (FOR UPDATE) và compare-and-set". Bài tập `LostUpdateFix` mô phỏng 3 lịch (không khóa / FOR UPDATE / version CAS) trên bảng giả, thấy lost update và cách sửa bằng khóa lẫn compare-and-set.
  - `lesson-db-023` (order 23, mid, 25') — "Tìm kiếm khoảng bằng binary search: lower bound, upper bound và so với quét toàn bộ". Bài tập `RangeSearch` cài lowerBound/upperBound/countInRange đếm số phép so sánh, so với linearCountInRange.
- Góc nhìn chọn vòng 2 (chưa trùng file): isolation — 001/013/020 đã có dirty/non-repeatable/phantom/write skew và optimistic đơn thuần; bài mới gộp lost update + pessimistic lock (FOR UPDATE) + CAS trong một mô phỏng. B-tree — 003/010/012/014/015/016/019 đã có point lookup/B+tree/composite/covering/HOT; bài mới tập trung binary search tìm biên khoảng (lower/upper bound) đếm bước.
- `related` dùng id câu hỏi có thật: 022 → db-002/db-004/db-016; 023 → db-001/db-003/db-023.
- Nghiệm thu đã chạy: `node --check js/data/lessons-db.js` OK; `node scripts/test-lessons.js lesson-db-022` (reference 7/7, starter biên dịch được và KHÔNG pass hết) và `lesson-db-023` (reference 6/6, starter không pass hết) OK; `node scripts/build-light-index.js` chạy thành công (db = 23 bài) khi q-sql.js tạm ổn định; `node scripts/validate.js` nạp lessons-db.js không có lỗi nào tham chiếu lesson-db-022/023.
- BLOCKER ngoài phạm vi (không tự sửa theo luật 3): tại thời điểm cuối, `node scripts/validate.js` / `build-light-index.js` còn báo lỗi từ các file của agent khác đang sửa dở (uncommitted): `labs-gc.js` lỗi cú pháp, `lessons-jpa.js` lesson-jpa-020 body < 2500, `lessons-jvm.js` lesson-jvm-004 related "jvm-032" không tồn tại. Các file này KHÔNG thuộc T2695. Đề xuất: integrator chạy lại `node scripts/build-light-index.js` rồi `node scripts/validate.js` sau khi gộp xong mọi task nội dung.
Reviewed-by: kilo (T2695R)
