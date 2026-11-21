# T2557 — 4 câu hỏi Senior Java (english) vào q-english.js

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`
After: T2530

Thêm **4 câu hỏi phỏng vấn mới** (topic: english) vào `js/data/q-english.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-english.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Tiếng Anh làm việc với khách Hàn/Nhật và PM nước ngoài (lang en, câu hỏi + trả lời mẫu tiếng Anh, giải thích tiếng Việt CÓ DẤU): báo trễ deadline và đề xuất phương án, hỏi lại requirement mơ hồ, báo cáo sự cố production cho khách (impact, root cause, action), từ chối yêu cầu ngoài scope lịch sự..

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-english.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 4 câu (id nối tiếp, không trùng ý các câu 006/010/219/222/228/229/230):
- english-231 (senior) — Báo trễ deadline cho khách Hàn + đưa 2–3 phương án A/B/C, văn bản trước–gọi sau, giữ thể diện.
- english-232 (lead) — Hỏi lại requirement mơ hồ (khách Nhật) không làm mất mặt: paraphrase + câu hỏi đóng + xác nhận bằng email.
- english-233 (senior) — Báo cáo sự cố production cho khách doanh nghiệp Hàn: 6 phần (tóm tắt/impact/timeline/root cause/action/prevention) + follow-up.
- english-234 (lead) — Từ chối yêu cầu ngoài scope lịch sự: ghi nhận → dữ liệu → phương án thay thế → đúng cấp → xác nhận văn bản.

Kiểm tra:
- `node --check js/data/q-english.js` → OK. Số câu english: 229 → 233.
- Tự kiểm 4 entry (script riêng): đủ field hợp lệ (topic=english, level, lang=en, follow 2–3), không backtick, không `${`, a > 1500 ký tự, đủ `**Tóm tắt:**`, code `~~~java`, bảng trade-off, `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:` — 0 lỗi.
- `node scripts/validate.js`: q-english.js KHÔNG có lỗi/cảnh báo.

Vướng mắc ngoài phạm vi (KHÔNG sửa theo luật 3 — không sở hữu file):
- `js/data/bugs.js` lỗi cú pháp dòng 9204 (backtick `new Date(...)` trong template literal) → `build-light-index.js` crash, không build lại được `index-light.js`.
- `js/data/q-spring-data.js.bak` là file rác chưa khai báo trong data-manifest → validate báo lỗi.
- `index-light.js` cũ (kể cả phần english do 2 file trên chặn build). Cần integrator/task chủ của bugs.js & q-spring-data.js sửa rồi chạy lại `node scripts/build-light-index.js` + `node scripts/validate.js`.
Reviewed-by: kilo (T2557R)
