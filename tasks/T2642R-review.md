# T2642R — Fact-check nội dung mới của T2642

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2642 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. 20 câu trắc nghiệm AI mới (qz-ai-031 đến qz-ai-050) đều đúng kỹ thuật:
- HNSW parameters (m, efConstruction, efSearch) trade-off đúng
- Post-filter issue với pgvector/HNSW khi filter metadata tenant nhỏ
- Cross-encoder vs bi-encoder: không precompute được, chỉ rerank top-k
- Retry 429/529: exponential backoff + jitter, chỉ retry transient errors
- Batch API cho workload offline lớn (~50% chi phí realtime)
- Asymmetric embedding models (E5/BGE/GTE) cần prefix query/passage đúng
- RAG eval: golden set + CI bắt hồi quy, tách metric retrieval/generation
- Context window lớn: tốn token, lost-in-the-middle, không miễn phí
- Tool output: giới hạn/lọc/tóm tắt ở code trước khi đưa vào model
- Temperature thấp cho extraction/RAG/reproducibility, cao cho creative
- Các khái niệm cơ bản: chunking, rerank, hallucination, prompt injection, tool calling, faithfulness
Markup hợp lệ, format multi-choice đúng (5 options, answer array 2 phần tử tăng dần, q có "(Chọn 2)").
Lỗi `index-light.js` stale do thêm câu hỏi mới, nhưng `build-light-index.js` bị chặn bởi lỗi syntax trong `lessons-design.js` (file không thuộc task này).
