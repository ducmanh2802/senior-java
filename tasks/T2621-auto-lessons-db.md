# T2621 — 2 bài học (db) vào lessons-db.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T2519

Thêm **2 bài học mới** (track `db`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Isolation level và các hiện tượng (dirty read, non-repeatable read, phantom, lost update) — bài tập mô phỏng 2 transaction trên bảng giả để thấy lost update và cách sửa bằng khoá/compare-and-set; (2) Index B-tree hoạt động thế nào — bài tập tìm kiếm khoảng trên mảng đã sắp xếp và so sánh số bước với quét toàn bộ.

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

### Đã thêm (chỉ THÊM vào cuối file, không sửa mục cũ)
- `lesson-db-020` — "Write skew và SERIALIZABLE: vì sao REPEATABLE READ chưa đủ" (isolation; 1 bài tập `WriteSkewSim`, 6 test, 4 câu check).
- `lesson-db-021` — "HOT update và fillfactor: vì sao UPDATE có khi không phải chạm vào index" (B-tree internals; 1 bài tập `HotUpdateSim`, 5 test, 4 câu check).

### Chủ đề (theo luật "chọn góc gần nhất chưa có")
Chủ đề yêu cầu (isolation + hiện tượng; B-tree + tìm kiếm khoảng) đã được phủ dày ở `lesson-db-001..019`: lost update 001, optimistic locking 002, B-tree 003, B+tree 010, composite + range binary search 012, covering/partial 014, non-repeatable/phantom 013… Nên chọn 2 góc gần nhất chưa có:
- Isolation → **write skew + SSI** (khác lost update/phantom; nêu rõ vì sao REPEATABLE READ không chặn được, còn SERIALIZABLE chặn bằng SSI + retry hoặc hàng guard).
- B-tree → **HOT update + fillfactor** (cơ chế duy trì index B-tree khi UPDATE; khác các bài về tra cứu/scan).

### Kiểm chứng
- `node --check js/data/lessons-db.js` → OK.
- `node scripts/test-lessons.js lesson-db-020` → reference 6/6 pass; `lesson-db-021` → 5/5 pass (runner cũng xác nhận starter biên dịch được và KHÔNG pass hết).
- `node scripts/validate.js lessons-db.js`: không có lỗi schema/markup/độ dài cho hai bài mới. Các dòng "related ... không phải id câu hỏi" là **dương tính giả** do file khác chưa nạp được (xem blocker). 6 id `related` (db-001, db-002, db-013, db-031, db-040, db-058) đều tồn tại trong ngân hàng ở bản HEAD (đã đối chiếu `git show HEAD:js/data/q-spring-data.js`).

### BLOCKER ngoài phạm vi (KHÔNG sửa vì không sở hữu)
`node scripts/build-light-index.js` và `node scripts/validate.js` (toàn repo) hiện **không thể OK** vì `js/data/q-spring-data.js` bị lỗi cú pháp ở `jpa-088` (quanh dòng 17585, "Unexpected identifier 'tắt'") — đây là chỉnh sửa dở dang của task khác (T2619-auto-q-jpa), KHÔNG phải file T2621 sở hữu. Khi file đó lỗi, `validate.js` không nạp được ngân hàng câu hỏi nên mọi `related` bị báo "không có thật" và `index-light.js` luôn bị coi là cũ.
- Hướng xử lý: chủ sở hữu `q-spring-data.js` sửa xong lỗi cú pháp, rồi chạy `node scripts/build-light-index.js` → `node scripts/validate.js` sẽ regen index (tự bao gồm 2 bài mới) và in `OK — không có lỗi.`
- Đã best-effort: `js/data/index-light.js` được tạo lại từ **bản HEAD của mọi file nguồn + `lessons-db.js` hiện tại** (chỉ 2 bài mới là thay đổi), nên đã có `lesson-db-020`/`lesson-db-021`. Khi `q-spring-data.js` được sửa, chỉ cần chạy lại `node scripts/build-light-index.js` để index khớp toàn bộ dữ liệu working tree.Reviewed-by: kilo (T2621R)
