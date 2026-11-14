# T2039 — 6 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T1715

Thêm **6 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: tình huống Senior/Lead: được giao refactor monolith 8 năm tuổi không có test, deadline gấp và PM muốn bỏ test, phát hiện đồng nghiệp commit secret lên Git, hệ thống báo cáo chạy chậm dần mỗi tháng, phải chọn giữa sửa nhanh hotfix và sửa gốc khi production đang lỗi, review PR lớn 3000 dòng — trả lời có cấu trúc, có số liệu, kèm cách nói khi phỏng vấn.

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
- Đã thêm 6 câu: `scenario-149` (senior, refactor monolith 8 năm không có test, deadline gấp, PM muốn bỏ test), `scenario-150` (senior, PM ép bỏ QA/test kịp deadline), `scenario-151` (senior, phát hiện đồng nghiệp commit secret lên Git), `scenario-152` (lead, hệ thống báo cáo chạy chậm dần mỗi tháng), `scenario-153` (lead, chọn hotfix vs sửa gốc khi production đang lỗi), `scenario-154` (senior, review PR lớn ~3000 dòng).
- Số lượng topic scenario: 148 → 154 (tăng 6, không sửa/xoá mục cũ).
- Kiểm tra: `node --check js/data/q-scenario.js` OK; `node scripts/build-light-index.js` OK (sinh lại index-light.js); file sở hữu không chứa backtick/`${`.
- `node scripts/validate.js` hiện vẫn báo LỖI nhưng đều thuộc file không thuộc quyền sở hữu (pre-existing): `q-devops-part.js` chưa khai báo trong `js/core/data-manifest.js`; `q-devops.js` `devops-160.a`/`devops-162.a` có ký tự CJK. Không sửa các file này theo luật sở hữu; đề xuất integrator xử lý riêng.
Reviewed-by: kilo (T2039R)
