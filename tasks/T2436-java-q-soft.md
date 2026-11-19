# T2436 — 4 câu hỏi Senior Java (behavioral) vào q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2328

Thêm **4 câu hỏi phỏng vấn mới** (topic: behavioral) vào `js/data/q-soft.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-soft.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: behavioral cho Senior (STAR có số liệu): xử lý incident và viết RCA, mentor junior, bất đồng thiết kế với lead/PO, làm việc cross-functional với team Data/AI; mỗi câu có câu trả lời mẫu STAR và lỗi hay gặp.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Added 4 new behavioral questions:
- behavioral-060 (senior): Writing RCA after production incident (5 Whys, corrective actions, verification)
- behavioral-061 (senior): Mentoring junior on system thinking/architecture (pair design, ADR, failure mode brainstorming)
- behavioral-062 (senior): Disagreement with PO on product decisions (data-driven, conditional agreement, disagree and commit)
- behavioral-063 (lead): Cross-functional work with Data/AI team (feature store, data contracts, batch vs real-time paths)
All questions follow STAR format with metrics, detailed explanations, real-world examples, and interview-ready answers.
Reviewed-by: kilo (T2436R)
