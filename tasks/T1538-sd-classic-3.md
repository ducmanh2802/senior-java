# T1538 — System design: 2 đề kinh điển (rate limiter phân tán, news feed)

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`
After: T1537

Thêm **2 đề system design mới** vào `js/data/sd-problems.js` (id `sd-NNN` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn trong file** (ví dụ sd-020, sd-021) và giữ đúng schema, độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive các điểm khó, trade-off, sự cố hay gặp, câu hỏi interviewer hay hỏi tiếp.

Đề: (1) rate limiter phân tán cho API gateway (token bucket/sliding window trên Redis, Lua script nguyên tử, nhiều region); (2) news feed kiểu mạng xã hội (fan-out on write vs read, celebrity problem, cache, phân trang).

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/sd-problems.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/sd-problems.js logs/tmp-T1538.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 đề mới:
- sd-027: Rate limiter phân tán cho API gateway (token bucket, sliding window, Redis Lua atomic, hot key sharding, multi-region active-active, local fallback bucket, fail-open/fail-closed)
- sd-028: News feed kiểu mạng xã hội (hybrid push/pull, celebrity problem, Redis ZSET feed cache, cursor pagination, ranking pipeline, merge pushed + celebrity posts)
Cả hai đều có đầy đủ phases, rubric, reference chi tiết (~5000 ký tự), followups, related.
Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
