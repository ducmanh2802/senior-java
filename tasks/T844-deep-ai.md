# T844 — Đào sâu senior: AI/LLM trong hệ thống Java (8 câu)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`

Topic **ai** (file `js/data/q-ai.js`): đọc HẾT các câu hiện có của topic, không lặp ý. Mục tiêu: **đào sâu kiến thức senior/lead** — cơ chế bên trong (internals) mà interviewer dùng để phân biệt senior thật với người chỉ biết dùng API.

Thêm **8 câu**: 5 `senior` + 3 `lead`. Mỗi câu chọn 1 chủ đề dưới (chủ đề nào đã có câu tương đương thì chọn góc sâu hơn hoặc chủ đề khác cùng topic, ghi lý do vào Notes):

- RAG từng bước: chunking (kích thước, overlap), embedding, vector index HNSW (đánh đổi recall/latency), reranking.
- Đánh giá RAG: tập câu hỏi vàng, recall@k, faithfulness; vì sao không chỉ thử bằng mắt.
- Prompt injection (trực tiếp và gián tiếp qua tài liệu), phòng thủ nhiều lớp.
- Tool calling / agent: vòng lặp, giới hạn bước, idempotency của tool, audit.
- Chi phí và độ trễ: token, prompt caching, streaming, batch; cách đặt hạn mức theo user.
- Tích hợp trong Java: Spring AI / LangChain4j, timeout + retry + fallback khi provider lỗi.

Yêu cầu riêng cho các câu này:
- Giải thích cơ chế **từng bước, như dạy người chưa biết**: dữ liệu/cấu trúc bên trong trông thế nào, chuyện gì xảy ra theo thứ tự, VÌ SAO thiết kế như vậy (trade-off).
- Có ít nhất 1 ví dụ cụ thể: code ngắn có comment, hoặc output thật (log, kubectl, EXPLAIN…), hoặc sơ đồ ASCII/`~~~seq`.
- Có mục "### Trên production" (triệu chứng thật, cách đo, cấu hình tuning có thật) và bảng so sánh khi phù hợp.
- 3000–5000 ký tự. `follow` 3 câu đào sâu tiếp. Có thể thêm `refs` (≤ 3, chỉ link tài liệu chính thức chắc chắn tồn tại; chạy `node scripts/check-links.mjs js/data/q-ai.js`).
- Không bịa flag/API. Không chắc thì viết ít lại nhưng đúng.

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

Thêm 8 câu ai-033..ai-040 (5 senior + 3 lead): chunking, RAG eval, indirect prompt injection, agent loop, prompt caching/streaming/limits, LLM resilience in Java, embedding/vector index at scale, multi-tenant RAG. validate OK.
Reviewed-by: kilo (T844R)
