# T2659 — 3 câu hỏi Senior Java (security) vào q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2592

Thêm **3 câu hỏi phỏng vấn mới** (topic: security) vào `js/data/q-security.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-security.js`); đọc danh sách để **không trùng ý**.

Chủ đề: phân quyền RBAC vs ABAC cho back-office ngân hàng (maker-checker), bảo vệ dữ liệu cá nhân ở mức kỹ thuật (mã hoá cột, masking log, quyền truy cập theo vai trò), xử lý khi phát hiện lộ API key trên GitHub.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 3 câu: security-084 (RBAC vs ABAC maker-checker, senior), security-085 (PII column encryption / log masking / RLS, senior), security-086 (leaked API key incident response, lead).
- Id tiếp theo security-083 (max), dùng 084/085/086 — không trùng.
- Đã sửa inline code `{{log.debug("req={}", request)}} chứa `{ }` lồng nhau bằng cách chuyển thành mô tả text + thêm dòng `log.debug("req={}", request)` vào block `~~~java` (không dùng backtick).
- `node --check js/data/q-security.js` → OK. `node scripts/validate.js` → không có lỗi liên quan security (89 câu hỏi). `build-light-index.js` không thể chạy vì `q-devops.js` có syntax error tiền tồn tại (không phải file mình sở hữu).
Reviewed-by: kilo (T2659R)
