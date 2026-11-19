# T2450 — 2 câu hỏi Senior Java (design) vào q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2431

Thêm **2 câu hỏi phỏng vấn mới** (topic: design) vào `js/data/q-system-design.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-system-design.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: system design dài (≥ 5000 ký tự, có ~~~seq): (1) hệ thống audit trail + event sourcing cho thay đổi trạng thái lệnh/task, truy vết theo thời gian; (2) data ingestion pipeline nhận event từ nhiều nguồn, chuẩn hóa, xử lý bất đồng bộ, đẩy downstream, đảm bảo không mất/không trùng.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 2 câu hỏi vào js/data/q-system-design.js: design-069 (senior, audit trail + event sourcing truy vết trạng thái đơn/task, time travel) và design-070 (lead, pipeline nạp sự kiện nhiều nguồn, chuẩn hóa, bất đồng bộ, không mất/không trùng). Mỗi câu ≥5000 ký tự, có ~~~seq, code Java ≤30 dòng, bảng trade-off, pitfall production, ví dụ đời thực có số liệu, trả lời mẫu 150–220 từ, follow 3 câu. node --check OK; build-light-index OK; qtool check q-system-design.js OK (6 lỗi còn lại là trong file khác do người khác sửa trước, không phải của task này).
Reviewed-by: kilo (T2450R)
