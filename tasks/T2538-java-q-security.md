# T2538 — 2 câu hỏi Senior Java (security) vào q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2432

Thêm **2 câu hỏi phỏng vấn mới** (topic: security) vào `js/data/q-security.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-security.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: (1) JWT hay session: quyết định thật nằm ở cửa sổ thu hồi nghiệp vụ chịu được — verify JWT local vài µs vs tra Redis ~0,1 ms/request, access token ngắn + refresh token xoay vòng + denylist jti trên Redis, bảng chọn theo loại hệ thống (ngân hàng, nội bộ nhà máy, mobile app); (2) Lộ ID tuần tự trên API (đối thủ đoán quy mô đơn hàng, IDOR, cache penetration khi dò ID không tồn tại): tầng dịch ID ở API boundary (mã hoá/Sqids/UUIDv7 public id) mà không migrate primary key, kèm kiểm tra quyền sở hữu. Mỗi câu có số đo cụ thể (ms, TPS, MB) tự nhất quán và mục ### Checklist cuối (5–7 việc làm được ngay), trước > Senior tip..

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 2 câu hỏi topic security vào js/data/q-security.js: security-082 (senior: JWT vs session cookie, quyết định theo cửa sổ thu hồi nghiệp vụ, verify JWT cục bộ vài micro giây vs tra Redis ~0,1 ms/request, access ngắn + refresh xoay vòng + denylist jti, bảng chọn theo loại hệ thống) và security-083 (lead: lộ ID tự tăng trên API, tầng dịch ID Sqids/UUIDv7 không migrate primary key, kiểm tra quyền sở hữu, cache penetration). Đã chạy node scripts/qtool.js append, node scripts/build-light-index.js, node scripts/validate.js → OK cho q-security.js (lỗi còn lại chỉ ở file khác, không phải của task này).
Reviewed-by: kilo (T2538R)
