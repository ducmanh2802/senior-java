# T123 — AI/LLM cho Java dev: Spring AI, LangChain4j, RAG

Status: DONE
Agent: agy
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn (không trùng). Thêm **~8 câu** topic `ai`: tích hợp LLM vào service Spring Boot (Spring AI ChatClient / LangChain4j AiServices — chỉ dùng API bạn chắc chắn, không chắc thì mô tả ở mức khái niệm), RAG pipeline (chunking, embedding, vector store pgvector, re-rank), đánh giá chất lượng (eval set, LLM-as-judge), chi phí & latency (prompt caching, streaming, timeout/retry), bảo mật (prompt injection, rò rỉ dữ liệu khách hàng ngân hàng, PII masking), tool calling/agent và giới hạn, khi nào KHÔNG nên dùng LLM. `node scripts/validate.js` → OK.

## Notes

- `node --check js/data/q-ai.js` thành công.
- `node scripts/validate.js` nhận diện 20 câu topic `ai`, nhưng chưa thể in `OK`: lỗi ngoài phạm vi task là `agy-write-test.txt: file không được khai báo trong index.html` và `lessons-microservices.js: file không được khai báo trong index.html`. Không sửa `index.html` hoặc các file không thuộc quyền sở hữu.
- 2026-10-23 (Claude): thêm 9 câu `ai-021`..`ai-029` vào cuối `q-ai.js` (6 senior, 2 lead, 1 mid; đáp án 3.300–4.000 ký tự): resilience khi gọi LLM (timeout/retry/circuit breaker, retry mặc định của Spring AI), chat memory đa người dùng (Spring AI ChatMemory / LangChain4j @MemoryId), vòng đời index pgvector (reindex tăng dần, đổi embedding model, filter HNSW), kiểm thử tính năng LLM (stub ChatModel, WireMock, Testcontainers, evaluator), chuyển đổi model (pairwise judge, canary, shadow), indirect prompt injection + rò rỉ qua markdown (OWASP LLM 2025), ước tính chi phí/quota bằng con số, khi nào KHÔNG dùng LLM, tool calling trong Spring AI (ToolContext, lỗi tool, returnDirect). API đã đối chiếu với tài liệu/source Spring AI 1.0, LangChain4j, pgvector README. `node scripts/validate.js` → OK (ai: 29 câu); `node scripts/check-links.mjs q-ai.js` → 21 link, 0 hỏng.
Reviewed-by: claude (viết bởi Claude, đã đối chiếu docs Spring AI 1.0 / LangChain4j / pgvector)
