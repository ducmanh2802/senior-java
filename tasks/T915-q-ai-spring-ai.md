# T915 — Spring AI và LangChain4j cho Java backend (8 câu)

Status: DONE
Agent: claude
Owns: `js/data/q-ai.js`

Topic **ai** (file `js/data/q-ai.js`): đọc HẾT câu hiện có của topic, không lặp ý; chủ đề đã có thì đào góc khác.

Thêm **8 câu** (2 `mid` + 4 `senior` + 2 `lead`), chuẩn "hay và chi tiết": `**Tóm tắt:**` → cơ chế từng bước (vì sao) → `### Ví dụ đời thực` (tình huống production có số liệu) → code thật có comment (≤ 30 dòng) hoặc `~~~seq` → bảng trade-off → pitfall → `### Trả lời mẫu khi phỏng vấn` (60–90 giây) → `> Senior tip:`. 3000–5000 ký tự, `follow` 3 câu. Chỉ dùng API có thật ở phiên bản hiện hành (kiểm tra docs chính thức); không chắc thì mô tả nguyên lý, không bịa tên class/method.

Chủ đề:
- Spring AI: ChatClient, advisors, structured output (map kết quả LLM sang record Java), cấu hình nhiều provider.
- LangChain4j: AI Services (interface + annotation), tools/function calling gọi service Java có sẵn, memory.
- RAG trong Java: chunking, embedding, vector store (pgvector), retrieval + re-ranking, đánh giá chất lượng câu trả lời.
- Tool calling an toàn: validate tham số, phân quyền theo user, giới hạn hành động có tác dụng phụ.
- Chi phí và độ trễ: cache, streaming (SSE) trong Spring, timeout/retry/circuit breaker cho lời gọi LLM, giới hạn token, theo dõi chi phí.
- Bảo mật: prompt injection, rò rỉ dữ liệu qua context, lọc PII, log an toàn.
- Kiểm thử ứng dụng LLM: test với model giả, golden set, đánh giá tự động.
- (lead) Kiến trúc tích hợp LLM vào hệ thống Java có sẵn: đặt ở đâu, sync vs async, fallback khi provider lỗi, chọn Spring AI hay LangChain4j.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-ai.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-ai.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes

Claude 2026-11-07: thêm 6 câu ai-041..046 (1 mid, 4 senior, 1 lead). Bỏ 2 câu vì trùng ai-002/005/007/008/016/024/029 đã có: Advisor chain, AI Services, MCP server, ingestion ETL, hybrid search RRF, virtual thread + bulkhead cho LLM.
