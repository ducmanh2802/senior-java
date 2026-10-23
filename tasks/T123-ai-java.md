# T123 — AI/LLM cho Java dev: Spring AI, LangChain4j, RAG

Status: TODO
Agent: agy
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn (không trùng). Thêm **~8 câu** topic `ai`: tích hợp LLM vào service Spring Boot (Spring AI ChatClient / LangChain4j AiServices — chỉ dùng API bạn chắc chắn, không chắc thì mô tả ở mức khái niệm), RAG pipeline (chunking, embedding, vector store pgvector, re-rank), đánh giá chất lượng (eval set, LLM-as-judge), chi phí & latency (prompt caching, streaming, timeout/retry), bảo mật (prompt injection, rò rỉ dữ liệu khách hàng ngân hàng, PII masking), tool calling/agent và giới hạn, khi nào KHÔNG nên dùng LLM. `node scripts/validate.js` → OK.

## Notes
