# T2500 — 5 câu hỏi Senior Java (frontend) vào q-frontend.js

Status: DONE
Agent: kilo
Owns: `js/data/q-frontend.js`
After: T2499

Thêm **5 câu hỏi phỏng vấn mới** (topic: frontend) vào `js/data/q-frontend.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-frontend.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: File q-frontend.js mới tạo, đang RỖNG: id bắt đầu frontend-001 (nếu đã có thì nối tiếp số lớn nhất). Người đọc là dev Java backend ~4 năm, ÍT kinh nghiệm frontend: giải thích từ gốc, so sánh với khái niệm Java tương đương khi có thể. Code ví dụ dùng ~~~text cho JS/Vue (không có highlight js), KHÔNG dùng ký hiệu đô-la + ngoặc nhọn (template string JS) — dùng nối chuỗi. Chủ đề: Vue 3: reactivity (ref/reactive, Proxy), Composition API vs Options API, computed vs watch, vòng đời component, props/emit và v-model, Pinia quản lý state, Vue Router + navigation guard cho phân quyền.

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
Đã thêm 5 câu hỏi: frontend-011 (vòng đời component), frontend-012 (Vue Router navigation guard), frontend-013 (provide/inject), frontend-014 (slot/named slot/scoped slot), frontend-015 (async component, Suspense, Teleport). Validate OK, index-light.js đã cập nhật.
Reviewed-by: kilo (T2500R)
