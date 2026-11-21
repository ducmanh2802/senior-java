# T2556 — 4 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2539

Thêm **4 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Tình huống IT nhà máy (MES): (1) dashboard sản lượng realtime cho 20 line (polling vs SSE vs WebSocket, tải DB); (2) dữ liệu máy (PLC/OPC-UA qua gateway) đổ vào hệ thống 5.000 bản ghi/giây; (3) truy vết lỗi: khách báo lỗi sản phẩm serial X → tìm lot linh kiện, máy, ca, công nhân trong 30 giây; (4) nâng cấp hệ thống MES đang chạy 24/7 không dừng xưởng (blue-green, migration DB tương thích ngược)..

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

## Notes
Added scenario-181..184. validate: q-scenario passes node --check; repo-wide validate blocked by pre-existing bugs.js syntax error (not owned) and stale index-light.
Reviewed-by: kilo (T2556R)
