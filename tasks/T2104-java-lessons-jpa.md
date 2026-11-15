# T2104 — 2 bài học (jpa) vào lessons-jpa.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jpa.js`
After: T2025

Thêm **2 bài học mới** (track `jpa`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: persistence context và dirty checking từ gốc: vì sao sửa entity không cần gọi save, flush khi nào, N+1 sinh ra thế nào; bài tập Java thuần: tự viết persistence context mini (identity map + snapshot để dirty check) và repository giả đếm số query để thấy N+1.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-jpa.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 bài học mới:
- lesson-jpa-014 (order 14): "Xây dựng persistence context mini: identity map, snapshot, dirty checking và flush từ con số 0" — 2 bài tập (UnitOfWork mô phỏng persistence context đầy đủ; RepositorySimulator mô phỏng merge vs persist)
- lesson-jpa-015 (order 15): "Phát hiện và khắc phục N+1 bằng mô phỏng repository đếm query" — 2 bài tập (Service.load giảm N+1 xuống 2 query; BatchFetcher mô phỏng batch fetching IN lô)

Kết quả nghiệm thu:
- `node --check js/data/lessons-jpa.js`: OK (không lỗi cú pháp)
- `node scripts/test-lessons.js`: 290/290 exercises OK (reference pass 100%, starter compile OK, không pass hết)
- `node scripts/validate.js`: Không có lỗi liên quan đến lesson-jpa-014 và lesson-jpa-015 (các lỗi hiển thị là pre-existing ở q-devops.js, q-java.js, lessons-devops.js, path.js, projects.js)
- `node scripts/build-light-index.js`: Không chạy được do lỗi pre-existing trong q-devops.js (unescaped `${{` trong template literal)
