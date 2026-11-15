# T2100 — 5 câu hỏi Senior Java (ai) vào q-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T1724

Thêm **5 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: tích hợp LLM vào backend Java: gọi API có timeout/retry/circuit breaker, RAG với pgvector, chống prompt injection, kiểm soát chi phí token, đánh giá chất lượng câu trả lời, Spring AI ở mức khái niệm.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-ai.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 5 câu hỏi vào js/data/q-ai.js, id ai-121 đến ai-125 (tiếp sau ai-120):
- ai-121 (senior): Hybrid search (keyword BM25 + vectơ) với RRF hợp nhất kết quả trong RAG
- ai-122 (senior): Cross-encoder rerank so với bi-encoder, luồng hai giai đoạn
- ai-123 (senior): LLM-as-judge đánh giá tự động, rubric 1-5, calibrate, rủi ro bias
- ai-124 (senior): Query decomposition và expansion cho multi-hop RAG, hợp nhất kết quả
- ai-125 (lead): Quyết định Fine-tuning vs RAG, tiêu chí, pitfall, kết hợp cả hai

Validation: node --check OK; node scripts/build-light-index.js OK; node scripts/validate.js → "OK — không có lỗi."
Reviewed-by: kilo (T2100R)
