# T2613 — 3 câu hỏi Senior Java (ai) vào q-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T2546

Thêm **3 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: đánh giá chất lượng RAG trước khi lên production (bộ câu hỏi vàng, recall@k, faithfulness, LLM-as-judge và cạm bẫy), chống prompt injection qua tài liệu được truy xuất, kiểm soát chi phí LLM theo team (quota, cache, chọn model nhỏ cho tác vụ đơn giản).

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
`node --check js/data/q-ai.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 3 câu vào js/data/q-ai.js: ai-152 (senior, đánh giá thay đổi RAG nhỏ với ít dữ liệu gán nhãn: dev/hold-out, rule + LLM-as-judge, ngưỡng pass/fail, overfit), ai-153 (lead, phòng prompt injection qua tài liệu user upload vào RAG: sanitize ingest, mô hình sandbox chỉ trích xuất, tách dữ liệu/chỉ thị, audit), ai-154 (senior, kiểm soát chi phí LLM theo team: quota token/ngày, hard cap, cache exact+semantic có teamId, định tuyến model, dashboard/cảnh báo 80%-100%).
- Góc chọn tránh trùng ý với câu cũ: ai-034/035/047/068/101/123/132 (không trùng ý trực tiếp; góc tập trung vào đánh giá thay đổi nhỏ dữ liệu ít, injection qua tài liệu upload, chi phí theo team).
- Chạy OK: node --check js/data/q-ai.js, node scripts/build-light-index.js, node scripts/validate.js → "OK — không có lỗi." (các cảnh báo còn lại là của file khác, không liên quan).
- Không commit, không sửa file khác.
Reviewed-by: kilo (T2613R)
