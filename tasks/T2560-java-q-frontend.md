# T2560 — 4 câu hỏi Senior Java (frontend) vào q-frontend.js

Status: DONE
Agent: kilo
Owns: `js/data/q-frontend.js`
After: T2555

Thêm **4 câu hỏi phỏng vấn mới** (topic: frontend) vào `js/data/q-frontend.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-frontend.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Vue thực chiến cho dự án nhà máy/doanh nghiệp: test component bằng Vitest + Vue Test Utils (mock axios), tối ưu hiệu năng (lazy route, v-memo/shallowRef, bảng 10.000 dòng), đa ngôn ngữ vue-i18n cho UI Hàn/Anh/Việt, xuất Excel nên làm ở frontend hay backend (dữ liệu lớn, định dạng, bảo mật)..

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
Đã thêm 4 câu hỏi mới vào js/data/q-frontend.js (chỉ sửa file này):
- frontend-034 (senior): Vitest + Vue Test Utils, mock axios, kiểm tra render/nút tải lại/thông báo lỗi.
- frontend-035 (lead): tối ưu bảng 10.000 dòng: lazy load route, v-memo, shallowRef, phân trang server-side.
- frontend-036 (senior): vue-i18n cho Hàn/Anh/Việt: namespace key, Intl/date/tiền tệ, pluralization, lazy load locale.
- frontend-037 (lead): xuất Excel frontend (SheetJS) hay backend (Apache POI/SXSSF): dữ liệu lớn, định dạng, bảo mật.

Kiểm tra:
- node --check js/data/q-frontend.js: OK.
- node scripts/qtool.js check js/data/q-frontend.js: OK for q-frontend.js; validate không báo lỗi/cảnh báo nào cho frontend (frontend 37 câu hỏi, 0 warning).
- node scripts/qtool.js append đã xác thực object-by-object, chỉ ids mới được thêm.

Chú ý: `node scripts/build-light-index.js` và `node scripts/validate.js` toàn diện KHÔNG in OK do lỗi cú pháp đã có sẵn (trước khi task này bắt đầu) trong js/data/q-microservices.js (Unexpected identifier) và js/data/quiz.js (Unexpected token), files không thuộc sở hữu task này nên không được sửa theo quy tắc 3 AGENTS.md. Do build-light-index crash khi nạp tất cả file dữ liệu, js/data/index-light.js vẫn chưa chứa frontend-034..037 nên validate báo "index-light đã cũ"; cần integrator sửa hai file trên rồi chạy lại build-light-index + validate.
