# T2881 — 3 câu hỏi Senior Java (ai) vào q-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T2752

Thêm **3 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: đánh giá chất lượng RAG trước khi lên production (bộ câu hỏi vàng, recall@k, faithfulness, LLM-as-judge và cạm bẫy), chống prompt injection qua tài liệu được truy xuất, kiểm soát chi phí LLM theo team (quota, cache, chọn model nhỏ cho tác vụ đơn giản).

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
`node --check js/data/q-ai.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- File đã có sẵn ai-161, ai-162, ai-163 từ lần chạy trước bị gián đoạn nhưng **lỗi cú pháp**: ai-162 và ai-163 thiếu backtick đóng `` `, `` của template literal, ai-162/163 thiếu field `follow`, seq của ai-161 (8 actors) và ai-163 (11 actors) vượt giới hạn 2–6 actor. Đã sửa: thêm backtick đóng, thêm `follow` (3 câu mỗi câu), rút gọn seq về ≤6 actor, sửa typo "đểCapacity"→"để phục vụ capacity planning", bỏ backtick lạc trong placeholder ai-162.
- Thêm mới **ai-164** (senior): cạm bẫy LLM-as-judge và hiệu chỉnh (calibration) — rubric nhị phân, ép JSON, khử position bias bằng chấm hai chiều, đo Cohen's kappa với nhãn người, neo drift; góc chưa có so với ai-155/158/161 (vốn nói golden set/recall/faithfulness/online eval).
- Chủ đề phủ: ai-161 online eval & drift (RAG eval), ai-162 chống prompt injection qua tài liệu truy xuất (dual-model), ai-163 FinOps/quota/chargeback/anomaly/forecast (chi phí theo team), ai-164 LLM-as-judge calibration.
- `node --check js/data/q-ai.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` không còn lỗi ở q-ai.js và index-light (các lỗi còn lại thuộc file của agent khác: quiz-ops, lessons-*, toeic-lr — không sửa theo luật 3). Không commit.
Reviewed-by: kilo (T2881R)
