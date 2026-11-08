# T1317 — Nâng cấp đáp án q-ai: ai-026 … ai-040

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T1302

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `ai-026` (4072 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-027` (3578 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-028` (3371 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-029` (4183 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-039` (3215 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-040` (3100 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

Với MỖI id ở trên:
1. **Thiếu Ví dụ đời thực** → thêm mục `### Ví dụ đời thực` (700–1200 ký tự): một tình huống production cụ thể, có số liệu, đi theo mạch **triệu chứng → điều tra (lệnh/metric/log cụ thể) → nguyên nhân gốc → cách xử lý → kết quả đo được**. Phải khớp với cơ chế mà đáp án đã giải thích; không bịa API, flag, tham số cấu hình hay tên metric. Không chắc thì viết ít lại nhưng đúng.
2. **Thiếu Trả lời mẫu** → thêm mục `### Trả lời mẫu khi phỏng vấn`: một đoạn văn nói tự nhiên 150–220 từ, ngôi thứ nhất, đặt trong dấu ngoặc kép, như ứng viên Senior trả lời thật (ý chính → cơ chế → trade-off → kinh nghiệm thực tế). Nếu đáp án đã có mục tương đương (ví dụ "Trả lời miệng 1 phút") thì KHÔNG thêm.
3. **Ngắn** (< 3000 ký tự) → bổ sung thêm phần giải thích cơ chế (`### Cơ chế từng bước` hoặc bảng so sánh, pitfall production) để đáp án đạt 3000–5000 ký tự.
4. Chèn các mục mới **ngay trước** dòng `> Senior tip:` (Senior tip luôn ở cuối). Viết tiếng Việt **có dấu đầy đủ**; thuật ngữ kỹ thuật giữ tiếng Anh.
5. **Thiếu follow** → thêm field `follow: [...]` gồm 2–3 câu hỏi đào sâu mà interviewer hay hỏi tiếp.

Luật:
- **Chỉ thêm**, không xoá/viết lại nội dung đã có, không đụng câu hỏi khác ngoài danh sách.
- File rất lớn: **sửa bằng công cụ edit theo từng đoạn nhỏ** (tìm đúng dòng `> Senior tip:` của id đó). **TUYỆT ĐỐI KHÔNG ghi lại toàn bộ file**, không sửa file nào khác (có cơ chế tự khôi phục file không thuộc task).
- Markup: dùng `{{code}}` cho inline code (không lồng dấu ngoặc nhọn bên trong), `~~~java` cho code block. KHÔNG dùng backtick và `${` trong đáp án.

Nghiệm thu:
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit.
- Ghi `Status: DONE` (sửa dòng Status ở đầu file) + Notes ngắn: id nào thêm mục gì.

## Notes
- `ai-026`: thêm `### Ví dụ đời thực` (indirect prompt injection qua email+markdown ảnh, mạch triệu chứng→điều tra→nguyên nhân→xử lý→kết quả đo được) và `### Trả lời mẫu khi phỏng vấn` (đoạn văn 1st person). Đã có `follow`. Sửa mô tả HTML ẩn (tránh thẻ HTML thô) để hết cảnh báo validate.
- `ai-027`: thêm `### Ví dụ đời thực` (tóm tắt 40k cuộc gọi: 429, retry nhân bội, prompt phá cache → token bucket/cache/budget, có số liệu) và `### Trả lời mẫu khi phỏng vấn`. Đã có `follow`.
- `ai-028`: thêm `### Ví dụ đời thực` (pilot 3 việc: format số TK, tính lãi, tóm tắt khiếu nại; sai lệch/chi phí/p95 → tách LLM ở rìa, code ở lõi) và `### Trả lời mẫu khi phỏng vấn`. Đã có `follow`.
- `ai-029`: thêm `### Ví dụ đời thực` (tool calling Spring AI: lộ entity/mask, LazyInit, vòng lặp dài → DTO mask, ToolContext, trần vòng, lỗi chuẩn hoá) và `### Trả lời mẫu khi phỏng vấn`. Đã có `follow`.
- `ai-039`: thêm `### Ví dụ đời thực` (18M chunk, RAM/latency, đổi embedding model → scalar quantization, shard, reindex v1→v2 có checkpoint/cutover/rollback) và `### Trả lời mẫu khi phỏng vấn`. Đã có `follow`.
- `ai-040`: thêm `### Ví dụ đời thực` (multi-tenant RAG: lộ chéo tenant do ACL lọc sai tầng + cache không cô lập + thiếu bulkhead → pre-filter ACL, key cache theo tenant/user/ACL, attributing/bulkhead, test cross-tenant) và `### Trả lời mẫu khi phỏng vấn`. Đã có `follow`.
- Chỉ sửa `js/data/q-ai.js` (edit từng đoạn nhỏ trước `> Senior tip:`). `node scripts/build-light-index.js` OK, `node --check` OK. `node scripts/validate.js`: không còn cảnh báo/lỗi cho q-ai.js; còn 1 lỗi pre-existing ngoài phạm vi task tại `q-security.js: security-008.a` (inline code {{ }} lồng nhau) — không thuộc owns, không đụng tới.
Reviewed-by: kilo (T1317R)
