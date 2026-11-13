# T1588 — TOEIC: thêm 6 bài express an opinion (s5) và 6 bài trả lời e-mail (w2)

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`

Thêm vào `js/data/toeic.js`: 6 bài part s5 và 6 bài part w2. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1511-toeic-s5.md` (đọc file task đó và các mục nó đã thêm). Id nối tiếp id lớn nhất hiện có; đọc các mục đã có để không trùng ý. Với w2 xem thêm `tasks/T1513-toeic-w2.md`. Validator kiểm tra số từ.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/toeic.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/toeic.js logs/tmp-T1588.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 12 mục vào `js/data/toeic.js` qua `node scripts/qtool.js append js/data/toeic.js logs/tmp-T1588.js`.
- s5 (express an opinion): `toeic-s5-011`…`toeic-s5-016` — chủ đề breaks tại nơi làm, mua sắm local vs online, feedback định kỳ, học công nghệ mới, học nhóm vs một mình, hoạt động tình nguyện; mỗi sample 100–180 từ, 3 tips tiếng Việt.
- w2 (respond to a written request): `toeic-w2-009`…`toeic-w2-014` — orientation, business conference, yêu cầu văn phòng phẩm, phản hồi trải nghiệm cửa hàng, chuẩn bị họp dự án, bảo trì tòa nhà cuối tuần; mỗi sample 70–170 từ, task yêu cầu 2 thông tin + 1 câu hỏi (hoặc theo đề), có lời chào/kết.
- `node scripts/build-light-index.js` và `node scripts/validate.js` → `OK — không có lỗi.` (TOEIC S&W: 84 bài, s5:16, w2:14). `node --check js/data/toeic.js` OK. Không commit, không sửa file ngoài phạm vi.
Reviewed-by: verify-only (code/UI task)
