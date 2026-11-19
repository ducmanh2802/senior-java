# T2453 — 3 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2435

Thêm **3 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: tình huống vận hành workflow: task kẹt ở trạng thái IN_PROGRESS do worker chết (lease/heartbeat), webhook đối tác trả 200 nhưng không xử lý (reconciliation), escalation gửi trùng hàng trăm thông báo (dedup + rate limit).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 3 câu hỏi mới vào `js/data/q-scenario.js`: `scenario-164` (senior — task kẹt IN_PROGRESS do worker chết, lease/heartbeat), `scenario-165` (senior — webhook partner trả 200 nhưng không xử lý, reconciliation), `scenario-166` (lead — escalation gửi trùng hàng trăm thông báo, dedup + rate limit).
- Ids nối tiếp sau `scenario-163` (id lớn nhất trước khi thêm); không trùng ý với mục đã có.
- Nghiệm thu: `node --check js/data/q-scenario.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` không có lỗi cho `q-scenario.js`.
- Ghi chú: validate repo có lỗi sẵn ở file `lessons-spring.js` (ngoại phạm vi task, không sửa).Reviewed-by: kilo (T2453R)
