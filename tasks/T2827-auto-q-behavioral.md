# T2827 — 3 câu hỏi Senior Java (behavioral) vào q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2797

Thêm **3 câu hỏi phỏng vấn mới** (topic: behavioral) vào `js/data/q-soft.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-soft.js`); đọc danh sách để **không trùng ý**.

Chủ đề: bất đồng kỹ thuật với tech lead về kiến trúc, nhận một hệ thống legacy không có test và phải giao tính năng trong 2 tuần, mentor junior viết code chậm/lỗi nhiều — trả lời theo STAR có số liệu.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu hỏi behavioral mới vào js/data/q-soft.js: behavioral-087 (senior), behavioral-088 (lead), behavioral-089 (senior).
Lưu ý: ba chủ đề trong mô tả task (bất đồng kiến trúc với tech lead; legacy không test giao tính năng 2 tuần; mentor junior chậm/lỗi) đã có sẵn behavioral-084/085/086, nên chọn góc chưa có: (087) bất đồng về REST đồng bộ vs Kafka bất đồng bộ cho luồng đặt hàng; (088) nhận module legacy từ team đã rời, không docs/test, sửa lỗi báo cáo cuối tháng trong 2 tuần; (089) mentor junior viết code chậm (N+1, load toàn bộ bảng) và hay bug production (null, thiếu xử lý exception), tập trung hiệu năng.
Da chạy: node --check js/data/q-soft.js (OK), node scripts/build-light-index.js (OK), node scripts/validate.js (không lỗi nào thuộc q-soft.js; lỗi còn lại nằm trong các file không sở hữu: q-frontend.js, quiz-ops.js, lessons-*.js).
Reviewed-by: kilo (T2827R)
