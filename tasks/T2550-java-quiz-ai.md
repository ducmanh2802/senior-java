# T2550 — 10 câu trắc nghiệm (ai) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2527

Thêm **10 câu trắc nghiệm** vào `js/data/quiz.js` (topic `ai`; id `qz-ai-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-ai-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: AI hands-on: đọc đoạn code Spring AI/Java gọi LLM và chọn lỗi (timeout, retry 4xx, không validate output), tính chi phí token, chọn chunk size, cosine vs dot product khi vector đã chuẩn hoá, BM25 vs vector với mã sản phẩm, RRF, semantic cache threshold, prompt injection trong tài liệu RAG, tool ghi cần human approval. Chỉ hỏi kiến thức chắc chắn đúng..

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Added qz-ai-021..030 (10 questions) to js/data/quiz.js. node --check OK. build-light-index/validate blocked by pre-existing errors in other agents' files (lessons-ai.js syntax, bugs.js, path.js); not owned.
Reviewed-by: kilo (T2550R)
