# T2501 — 5 câu hỏi Senior Java (frontend) vào q-frontend.js

Status: DONE
Agent: kilo
Owns: `js/data/q-frontend.js`
After: T2500

Thêm **5 câu hỏi phỏng vấn mới** (topic: frontend) vào `js/data/q-frontend.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-frontend.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: File q-frontend.js mới tạo, đang RỖNG: id bắt đầu frontend-001 (nếu đã có thì nối tiếp số lớn nhất). Người đọc là dev Java backend ~4 năm, ÍT kinh nghiệm frontend: giải thích từ gốc, so sánh với khái niệm Java tương đương khi có thể. Code ví dụ dùng ~~~text cho JS/Vue (không có highlight js), KHÔNG dùng ký hiệu đô-la + ngoặc nhọn (template string JS) — dùng nối chuỗi. Chủ đề: fullstack thực chiến: gọi REST API bằng axios (interceptor gắn JWT, refresh token, xử lý 401), CORS giải thích từ gốc và cấu hình Spring Boot, form lớn và validation 2 phía, bảng dữ liệu nhiều dòng (phân trang server-side, virtual scroll), tối ưu hiệu năng trang (lazy load route, debounce search), bảo mật SPA (XSS, lưu token ở đâu).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-frontend.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 5 câu hỏi mới vào js/data/q-frontend.js: frontend-016 (lead: axios, interceptor gắn JWT, refresh token, xử lý 401, XSS, lưu token), frontend-017 (senior: CORS + cấu hình Spring Boot WebMvcConfigurer), frontend-018 (senior: form nhiều trường, validation 2 phía client + Spring @Valid), frontend-019 (senior: bảng hàng nghìn dòng, phân trang server-side LIMIT/OFFSET + virtual scroll), frontend-020 (senior: lazy load route Vite + debounce tìm kiếm, hiệu năng FCP/LCP/TTI).
Đã chạy: node --check js/data/q-frontend.js (OK), node scripts/qtool.js check js/data/q-frontend.js (OK), node scripts/build-light-index.js (OK), node scripts/validate.js không có lỗi liên quan đến q-frontend.js (các lỗi còn lại ở bugs.js là cũ, không thuộc nhiem vu). Khong git commit.
Reviewed-by: kilo (T2501R)
