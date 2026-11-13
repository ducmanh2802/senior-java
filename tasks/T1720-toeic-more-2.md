# T1720 — TOEIC: thêm 6 bài read aloud (s1), 6 bài describe a picture (s2), 10 câu viết theo ảnh (w1)

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`

Thêm vào `js/data/toeic.js`: 6 bài s1, 6 bài s2, 10 bài w1, chủ đề công sở và đời sống chưa có. Giữ đúng định dạng, schema, độ dài và luật của task mẫu `tasks/T1509-toeic-s1-s2.md` (đọc file task đó). Id nối tiếp id lớn nhất hiện có. KHÔNG đọc toàn bộ file dữ liệu lớn: dùng `node scripts/qtool.js list <file>` để xem các mục đã có (tránh trùng), `qtool.js show <file> <id>` để xem một mẫu, rồi viết ngay vào file tạm và `qtool.js append`. Với w1 xem thêm `tasks/T1512-toeic-w1.md`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/toeic.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/toeic.js logs/tmp-T1720.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 22 bài TOEIC vào js/data/toeic.js:
- s1 (read aloud): toeic-s1-009…014 (6 bài: thông báo đánh giá nhân viên, chào mừng hội nghị tech, nhắc lịch hẹn nha khoa, khai trại đường đi bộ, gia hạn giờ trung tâm thương mại, đóng gara đỗ xe tu sửa)
- s2 (describe a picture): toeic-s2-009…014 (6 bài: khu vực tiếp khách công ty tech, không gian coworking, sân thượng văn phòng lúc hoàng hôn, phòng server hiện đại, buổi đào tạo an ninh mạng, khu vực logistics/kho hàng)
- w1 (write a sentence): toeic-w1-021…030 (10 bài: phân tích dữ liệu, check-in khách sạn, trình bày báo cáo online, bảo vệ kiểm tra xe, pha cà phê phòng nghỉ, niêm phong thùng hàng, phỏng vấn bắt tay, hành khách đặt vali lên băng tải, khách thử tai nghe Bluetooth, kỹ sư quét mã vạch nhà máy)
Tất cả đều pass validate.js. index-light.js đã rebuild.
Reviewed-by: verify-only (code/UI task)
