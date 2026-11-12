# T1547 — System design: 2 đề kinh điển (URL shortener, chat 1-1 và nhóm)

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`
After: T1546

Thêm **2 đề system design mới** vào `js/data/sd-problems.js` (id `sd-NNN` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn trong file** (ví dụ sd-020, sd-021) và giữ đúng schema, độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive các điểm khó, trade-off, sự cố hay gặp, câu hỏi interviewer hay hỏi tiếp.

Đề: (1) URL shortener (sinh mã, chống trùng, cache, analytics click, hết hạn link); (2) hệ thống chat 1-1 và nhóm (WebSocket, lưu tin nhắn, trạng thái đã đọc, online presence, đồng bộ nhiều thiết bị).

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/sd-problems.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/sd-problems.js logs/tmp-T1547.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm `sd-031` (URL shortener: sinh mã, chống trùng, cache, analytics click, hết hạn link) và `sd-032` (Chat 1-1 và nhóm: WebSocket, lưu tin nhắn, đã đọc, presence, đồng bộ nhiều thiết bị) vào `js/data/sd-problems.js` bằng `node scripts/qtool.js append`.
- Mỗi đề gồm: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, phases (requirements/estimation/API & data model/high-level design/deep dive), rubric, reference chi tiết (giải thích thuật ngữ, `~~~seq` cho luồng chính, deep dive/trade-off/sự cố, ví dụ đời thực, trả lời mẫu), followups, related.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → `OK — không có lỗi.` (còn cảnh báo path.js có sẵn, không thuộc phạm vi task). No commit. Temp files: `logs/make-t1547.js`, `logs/tmp-T1547.js`.
