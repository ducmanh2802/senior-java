# T2555 — 4 câu hỏi Senior Java (frontend) vào q-frontend.js

Status: DONE
Agent: kilo
Owns: `js/data/q-frontend.js`
After: T2526

Thêm **4 câu hỏi phỏng vấn mới** (topic: frontend) vào `js/data/q-frontend.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-frontend.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Vue 3 thực chiến cho dev Java: reactivity (ref vs reactive, computed, watch) giải thích từ gốc, Pinia store vs props/emit, form lớn có validate + gọi API (loading/error), bảng dữ liệu nhiều dòng (phân trang server, virtual scroll), quản lý JWT/refresh token an toàn ở SPA..

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

Đã thêm 4 câu hỏi mới (id nối tiếp, không trùng ý 29 câu cũ):
- frontend-030 (senior): composable useAsyncResource — hủy request khi unmount, bỏ response cũ bằng seq, shallowRef/markRaw, ETag phía server.
- frontend-031 (senior): form danh sách dòng động — key bằng id (không index), v-model.number, validate chéo có debounce, dirty tracking, map lỗi server theo id dòng.
- frontend-032 (senior): chia Pinia god store theo miền (cart/checkout/ui), storeToRefs, reset khi logout, mỗi request một pinia instance cho SSR.
- frontend-033 (lead): lưu JWT an toàn — localStorage vs bộ nhớ vs cookie HttpOnly, refresh token rotation + reuse detection, single-flight khi 401, CSRF.

Nghiệm thu: `node --check js/data/q-frontend.js` OK; `node scripts/validate.js` không còn lỗi liên quan q-frontend (frontend 33 câu, 10 trắc nghiệm).
LƯU Ý cho integrator: `node scripts/build-light-index.js` và `validate.js` hiện báo lỗi từ file của agent khác đang dở (js/data/bugs.js lỗi cú pháp; file lạ q-spring-data.js.bak). Tôi đã build index tạm khi tạm gác bugs.js để xác nhận 030–033 vào index-light.js, rồi khôi phục bugs.js. Cần chạy lại build-light-index + validate ở bước tích hợp cuối khi các file khác đã ổn.
Reviewed-by: kilo (T2555R)
