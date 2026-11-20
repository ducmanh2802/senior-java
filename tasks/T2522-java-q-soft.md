# T2522 — 5 câu hỏi Senior Java (behavioral) vào q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2521

Thêm **5 câu hỏi phỏng vấn mới** (topic: behavioral) vào `js/data/q-soft.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-soft.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Level lead. Người học là dev ~4 năm, CHƯA có chức danh lead chính thức (chỉ lead không chính thức: kèm junior, phụ trách module, xử lý sự cố) — mỗi câu phải có mục "### Nếu bạn chưa từng làm lead chính thức" chỉ cách kể kinh nghiệm lead không chính thức một cách trung thực. Mỗi câu: ### Interviewer muốn nghe gì (tín hiệu lead) → khung trả lời STAR → ### Trả lời mẫu khi phỏng vấn (150–220 từ, có số liệu) → ### Câu trả lời yếu thường gặp (vì sao bị đánh giá thấp) → follow 2–3 câu đào sâu. Chủ đề: (1) đo năng suất/chất lượng team (DORA metrics, bug escape rate) mà không biến thành micro-manage; (2) quyết định kỹ thuật sai và cách bạn nhận lỗi, sửa sai (failure story); (3) nói KHÔNG / đàm phán scope với khách hàng hoặc PM (đặc biệt khách Hàn/Nhật trong outsource); (4) cân bằng giữa code và quản lý — bạn còn code bao nhiêu %; (5) vì sao bạn muốn làm lead và điểm yếu của bạn khi làm lead.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Added behavioral-070..behavioral-074 (5 câu) vào q-soft.js.
Reviewed-by: kilo (T2522R)
