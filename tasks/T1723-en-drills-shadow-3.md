# T1723 — Luyện nói tiếng Anh: 20 câu shadowing nói chuyện với khách hàng freelance

Status: DONE
Agent: kilo
Owns: `js/data/drills-shadow.js`

Thêm **20 câu shadowing** (theme "smalltalk", "negotiation", "project") vào `js/data/drills-shadow.js`: câu dùng khi làm việc với khách nước ngoài (xác nhận yêu cầu, báo tiến độ, báo chậm trễ, hỏi lại, đề xuất phạm vi, thương lượng giá, kết thúc dự án). Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1557-en-drills-shadow-ai.md` (đọc file task đó). Id nối tiếp id lớn nhất hiện có. KHÔNG đọc toàn bộ file dữ liệu lớn: dùng `node scripts/qtool.js list <file>` để xem các mục đã có (tránh trùng), `qtool.js show <file> <id>` để xem một mẫu, rồi viết ngay vào file tạm và `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/drills-shadow.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/drills-shadow.js logs/tmp-T1723.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 20 câu shadowing mới (append bằng `node scripts/qtool.js append js/data/drills-shadow.js logs/tmp-T1723.js`, sau đó xoá file tạm):

- Theme `smalltalk`: `drill-shadow-261` … `drill-shadow-266`, `drill-shadow-280` (xác nhận yêu cầu, hỏi lịch trình, hỗ trợ đa ngôn ngữ, liên hệ khi bị chặn, docs, ví dụ đầu ra, hỏi làm rõ thêm).
- Theme `project`: `drill-shadow-267` … `drill-shadow-271`, `drill-shadow-279` (báo cáo tiến độ hàng tuần, API sẵn sàng review, thông báo trễ giao hàng, sửa lỗi cuối, bàn giao tài liệu, đóng dự án).
- Theme `negotiation`: `drill-shadow-272` … `drill-shadow-278` (mức phí giờ, giảm phạm vi theo ngân sách, chi phí công việc bổ sung, thêm thời gian không tốn thêm, chấp nhận đề xuất, linh hoạt giá dài hạn, ký hợp đồng trước khi làm).

Mỗi câu 8–25 từ tiếng Anh (thực tế 9–14 từ), không backtick, không `${`, tiếng Việt có dấu đầy đủ. Không trùng ý với câu đã có.

Nghiệm thu: `node --check js/data/drills-shadow.js` OK; `node scripts/qtool.js check` OK; `node scripts/build-light-index.js` ghi `js/data/index-light.js`; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo cũ về path.js/bài học không nằm trong PATH, không liên quan task). Không commit, không sửa file nào khác.Reviewed-by: check-i18n (translation, no LLM review)
