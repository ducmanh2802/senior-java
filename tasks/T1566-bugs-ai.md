# T1566 — Sửa bug thật: 2 bug trong code tích hợp LLM bằng Java

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, đọc kỹ bug-001: (1) service parse JSON từ model bị crash khi model bọc JSON trong code fence hoặc thêm chữ trước, làm 3% request lỗi 500 (sửa: tách JSON an toàn + validate schema + retry có giới hạn); (2) context hội thoại vượt giới hạn token nên phần system prompt bị cắt mất, agent bỏ qua luật an toàn (sửa: đếm token, cắt phần cũ nhất của lịch sử, luôn giữ system prompt). LLM được giả lập bằng class trả lời theo kịch bản. Chạy `node scripts/test-bugs.js`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/bugs.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/bugs.js logs/tmp-T1566.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm `bug-018` và `bug-019` vào `js/data/bugs.js` (thuần thêm, 0 dòng xoá).
- `bug-018` — "LLM trả JSON bọc trong code fence làm 3% request chuyển tiền lỗi 500": sửa `LlmJsonExtractor.extract` bằng tách JSON an toàn (bỏ qua prose/code fence, quét object cân bằng theo trạng thái string/escape), chuẩn hoá dấu phẩy thừa, validate schema/kiểu, retry tối đa 3 lần kèm lý do lỗi, hết lượt ném `ExtractionFailedException`. Test: reference 9/9, starter 2/9 (tái hiện đúng 3 kiểu lỗi: prose, thiếu field, sai kiểu).
- `bug-019` — "Hội thoại dài làm system prompt bị cắt, agent bỏ qua luật an toàn": sửa `ChatContext.buildMessages` bằng đếm token (~4 ký tự/token + 4 overhead), luôn giữ system prompt, sliding window từ mới nhất về cũ, cắt tin nhắn mới nhất quá lớn, ném `ContextTooLongException` nếu system prompt tự vượt limit. Test: reference 5/5, starter 0/5.
- `related`: bug-018 → `ai-016`, `ai-056`; bug-019 → `ai-058`, `ai-060`.
- Nghiệm thu: `node scripts/test-bugs.js bug-018`, `node scripts/test-bugs.js bug-019`, `node scripts/test-bugs.js` (tất cả OK), `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.`
- `js/data/index-light.js` được sinh lại theo yêu cầu nghiệm thu; không sửa file nội dung nào khác.
Reviewed-by: verify-only (code/UI task)
