# T2539 — 2 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2529

Thêm **2 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: (1) Thiết kế tác vụ chạy lâu từ sync sang async: bảng jobs (status, attempts, heartbeat_at, locked_by), worker lấy job bằng SELECT … FOR UPDATE SKIP LOCKED, heartbeat + reaper thu hồi job của worker chết, checkpoint để chạy tiếp, status API + nơi lưu file kết quả, chọn queue theo nấc (bảng DB → Redis → SQS/RabbitMQ → Kafka); (2) Chọn optimistic hay pessimistic lock từ yêu cầu nghiệp vụ: số đo 50 luồng tranh 1 row (optimistic retry bão hoà, pessimistic ổn định hơn), các dấu hiệu chọn (bán vé/tồn kho nóng vs sửa hồ sơ), FOR UPDATE vs version column vs Redis lock (ai nhả lock khi process chết, lease + fencing token). Mỗi câu có số đo cụ thể (ms, TPS, MB) tự nhất quán và mục ### Checklist cuối (5–7 việc làm được ngay), trước > Senior tip..

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 2 câu scenario vào js/data/q-scenario.js (chèn trước dòng `);` cuối file, không sửa mục của người khác):
- scenario-179 (senior): thiết kế tác vụ chạy lâu từ sync sang async — bảng jobs (status, attempts, heartbeat_at, locked_by), worker lấy job bằng SELECT ... FOR UPDATE SKIP LOCKED, heartbeat + reaper thu hồi job worker chết, checkpoint, status API + file kết quả, chọn queue theo nấc (DB → Redis → SQS/RabbitMQ → Kafka).
- scenario-180 (lead): chọn optimistic hay pessimistic lock từ yêu cầu nghiệp vụ — 50 luồng tranh 1 row (optimistic retry bão hoà, pessimistic ổn định hơn), dấu hiệu chọn (bán vé/tồn kho nóng vs sửa hồ sơ), FOR UPDATE vs version column vs Redis lock (ai nhả lock khi process chết, lease + fencing token).
Mỗi câu có số đo cụ thể (ms, TPS, MB), bảng trade-off, pitfall production, ví dụ đời thực, trả lời mẫu, Checklist cuối (5–7 việc), > Senior tip, follow 2–3 câu. node --check OK; qtool check OK cho q-scenario.js; build-light-index đã chạy. validate.js còn lỗi bugs.js (bug-047/048) do agent khác sở hữu, không nằm trong task này.
Reviewed-by: kilo (T2539R)
