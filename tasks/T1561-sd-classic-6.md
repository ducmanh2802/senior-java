# T1561 — System design: 2 đề (hệ thống thanh toán, job scheduler phân tán)

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`
After: T1547

Thêm **2 đề system design mới** vào `js/data/sd-problems.js` (id `sd-NNN` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn trong file** (ví dụ sd-020, sd-021) và giữ đúng schema, độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive các điểm khó, trade-off, sự cố hay gặp, câu hỏi interviewer hay hỏi tiếp.

Đề: (1) hệ thống thanh toán/chuyển tiền nội bộ (ledger double-entry, idempotency, đối soát, saga khi gọi cổng thanh toán ngoài); (2) distributed job scheduler (lập lịch cron cho hàng triệu job, đảm bảo chạy đúng một lần, retry, phân vùng theo shard).

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/sd-problems.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/sd-problems.js logs/tmp-T1561.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 đề system design mới:
- sd-033: Hệ thống thanh toán/chuyển tiền nội bộ (ledger double-entry, idempotency, đối soát, saga gọi cổng ngoài)
- sd-034: Distributed job scheduler (lập lịch cron cho hàng triệu job, đảm bảo chạy đúng một lần, retry, phân vùng theo shard)

Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
Reviewed-by: kilo (T1561R)
