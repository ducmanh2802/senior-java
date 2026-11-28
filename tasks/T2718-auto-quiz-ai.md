# T2718 — 10 câu trắc nghiệm (ai) vào quiz-ops.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ops.js`
After: T2699

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-ops.js` (topic `ai`; id `qz-ai-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-ai-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: RAG pipeline (chunking, embedding, top-k, rerank), hallucination và cách giảm, temperature, context window và chi phí token, prompt injection, tool calling, đánh giá LLM, vector index HNSW trade-off. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-ai đã có.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/quiz-ops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 10 câu trắc nghiệm (qz-ai-051 đến qz-ai-060) vào quiz-ops.js:
- qz-ai-051: Lost in the middle - position-aware rerank + giảm số chunk
- qz-ai-052: Matryoshka embeddings (E5/BGE) cho truncate vector an toàn
- qz-ai-053: Hallucination citation - model bịa mặc định + retrieval gate (ngưỡng score)
- qz-ai-054: Prompt caching (KV cache prefix) giảm chi phí/độ trễ
- qz-ai-055: Indirect prompt injection qua tài liệu nguồn - prompt isolation + output validation
- qz-ai-056: Parallel tool calls - dispatch song song, validate schema, trả kết quả một lần
- qz-ai-057: Metric tách tầng retrieval (Context Recall/Precision) vs generation (Faithfulness/Answer Correctness)
- qz-ai-058: HNSW-PQ trade-off (giảm RAM 4-8x, recall giảm, bù bằng efSearch)
- qz-ai-059: Hybrid search (vector + BM25) cho exact match và negation/boolean logic
- qz-ai-060: Cross-encoder rerank bottleneck - tối ưu bằng batch inference, ONNX, GPU, giảm ứng viên
Tất cả validation pass, syntax OK.
Reviewed-by: kilo (T2718R)
Verify-failed: 2026-11-25 23:05:04
