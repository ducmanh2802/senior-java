# T2047 — 6 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2039

Thêm **6 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: tình huống phỏng vấn system thực tế cho Java backend: service gọi 3 API ngoài chậm cần giảm latency (song song hoá, timeout, cache), báo cáo Excel 1 triệu dòng làm OOM (streaming SXSSF), job gửi email trùng khi chạy 2 instance (ShedLock), API bị gọi dồn sau sự cố (retry storm, jitter), tăng 10 lần traffic trước Tết, migrate DB không downtime.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã hoàn tất bổ sung 6 câu mới với các id nối tiếp: `scenario-155` đến `scenario-160`; chủ đề: gọi song song 3 API ngoài, export Excel lớn bằng Apache POI SXSSF, chống gửi email trùng bằng ShedLock, retry storm và exponential backoff có jitter, chuẩn bị tải gấp 10 lần trước Tết, migrate PostgreSQL không downtime.
- Đã chạy `node --check js/data/q-scenario.js`, `node scripts/build-light-index.js`, và `node scripts/validate.js`; kết quả cuối: `OK — không có lỗi.`
- Không chạy `git commit`.
