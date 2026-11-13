# T1582 — System design: 2 đề (dịch vụ chat AI kiểu ChatGPT, ghép chuyến xe)

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`

Thêm **2 đề system design mới** vào `js/data/sd-problems.js` (id `sd-NNN` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn trong file** (ví dụ sd-020, sd-021) và giữ đúng schema, độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive các điểm khó, trade-off, sự cố hay gặp, câu hỏi interviewer hay hỏi tiếp.

Đề: (1) dịch vụ chat AI cho 1 triệu người dùng (streaming token qua SSE, lưu lịch sử hội thoại, quota theo gói, chọn model theo tải, chống lạm dụng); (2) ghép chuyến xe công nghệ (vị trí tài xế thời gian thực, geohash/index không gian, ghép cặp, giá động, trạng thái chuyến).

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/sd-problems.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/sd-problems.js logs/tmp-T1582.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 đề mới: `sd-037` (dịch vụ chat AI streaming SSE, quota, model routing, chống lạm dụng) và `sd-038` (ghép chuyến xe H3 grid, CAS driver state, surge PID, hot zone queue). Validate OK.
Reviewed-by: kilo (T1582R)
