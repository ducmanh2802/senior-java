# T2491 — 3 câu hỏi Senior Java (ai) vào q-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T2465

Thêm **3 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: AI cho sản xuất từ góc nhìn backend Java: pipeline phát hiện lỗi sản phẩm bằng ảnh (AOI/vision) — nhận ảnh, gọi inference, lưu kết quả, phản hồi về dây chuyền trong < 1 giây; predictive maintenance từ dữ liệu cảm biến (feature theo cửa sổ thời gian, ngưỡng, cảnh báo); human-in-the-loop xác nhận lỗi để gán nhãn lại.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-ai.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Thêm 3 câu hỏi mới vào js/data/q-ai.js: ai-141 (lead, AOI/vision product defect pipeline <1s), ai-142 (senior, predictive maintenance sensor data windowed features + threshold + alerts), ai-143 (senior, human-in-the-loop error confirmation for relabeling). Id nối tiếp max id ai-140. Chạy build-light-index.js rồi validate.js — không có lỗi mới liên quan đến q-ai.js (các LỖI còn lại trong lessons-spring.js là cũ, không thuộc file sở hữu).
Reviewed-by: kilo (T2491R)
