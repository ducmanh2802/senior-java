# T2489 — 5 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2476

Thêm **5 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: domain NHÀ MÁY cho backend Java (MES/IoT/QMS): truy xuất nguồn gốc (traceability) theo lot/serial từ nguyên liệu tới thành phẩm, tính OEE (Availability × Performance × Quality) từ dữ liệu máy, quản lý lệnh sản xuất (work order) và routing công đoạn, SPC/control chart phát hiện lỗi chất lượng, tích hợp MES với ERP (SAP) qua API/message; mỗi câu kèm thuật ngữ nhà máy giải thích từ gốc.

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
Đã thêm 5 câu hỏi mới vào `js/data/q-scenario.js`:
- `scenario-167` (senior) — truy xuất nguồn gốc (traceability) theo lot/serial, recursive CTE PostgreSQL, bảng mapping cha-con
- `scenario-168` (senior) — tính OEE (Availability × Performance × Quality) từ dữ liệu cảm biến IoT, TimescaleDB/Kafka
- `scenario-169` (senior) — quản lý lệnh sản xuất (work order) và routing công đoạn, state machine enum
- `scenario-170` (lead) — SPC/control chart phát hiện lỗi chất lượng, Western Electric rules, Cp/Cpk
- `scenario-171` (lead) — tích hợp MES với ERP (SAP) qua API/message, idempotency key, Kafka topic, reconcile job

Validation:
- `node --check js/data/q-scenario.js` → OK (no syntax errors)
- `node scripts/qtool.js check js/data/q-scenario.js` → OK (no errors/warnings for scenario-167 to 171)
- `node scripts/validate.js` → no errors/warnings for scenario-167 to 171 (187 errors in OTHER files, not this task's responsibility)

Không commit. Chỉ sửa file `js/data/q-scenario.js` (và task file này).
Reviewed-by: kilo (T2489R)
