# T1506 — Câu chuyện STAR mẫu: star-008…star-013

Status: DONE
Agent: kilo
Owns: `js/data/star-stories.js`
After: T1505

Thêm **6 câu chuyện STAR mẫu** vào `js/data/star-stories.js`, id `star-008` … `star-013`. Người dùng là dev Java ~4 năm kinh nghiệm: họ chọn mẫu gần với dự án của mình rồi **sửa thành chuyện thật**, sau đó tập kể to khi phỏng vấn (tiếng Việt và tiếng Anh).

**Đọc kỹ trước:** chú thích schema ở đầu file và bài mẫu `star-001` (`node scripts/qtool.js show js/data/star-stories.js star-001`). Viết đúng chất lượng và độ cụ thể như vậy.

Tình huống (theme — nội dung):
1. Thất bại — migration dữ liệu lỗi phải rollback, bài học về kế hoạch và kiểm thử
2. Chủ động — tự đề xuất và làm CI/CD hoặc test tự động giảm lỗi release
3. Thuyết phục — thuyết phục PM dành thời gian trả technical debt bằng số liệu
4. Hiệu năng — thêm cache Redis có chiến lược invalidation, xử lý cache stampede
5. Sự cố production — double charge / dữ liệu trùng do retry, sửa bằng idempotency key
6. Dẫn dắt — dẫn dắt tách một module khỏi monolith thành service (strangler)

## Yêu cầu
- Mỗi chuyện là một dự án Java/Spring Boot điển hình ở Việt Nam (thương mại điện tử, ngân hàng, logistics, outsourcing Nhật/Âu-Mỹ, SaaS…), mỗi chuyện một bối cảnh khác nhau; không tên công ty thật, không tên người.
- **Kỹ thuật phải ĐÚNG** (Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL, Kafka, Redis, AWS hiện hành): metric, lệnh, config phải có thật; số liệu khớp nhau (làm phép tính).
- `action` kể từng bước cụ thể (công cụ, lệnh, quyết định và lý do); `result` có số đo được.
- `spoken` 150–260 từ tiếng Việt có dấu, giọng nói tự nhiên; `spoken_en` 130–220 từ, câu ngắn dễ nói (B1–B2), cùng nội dung.
- `adapt`: 3–5 hướng dẫn cụ thể người học cần thay gì để thành chuyện của mình (và cảnh báo phần interviewer sẽ hỏi sâu). `follow`: 2–4 câu hỏi đào sâu thật.
- Level: chủ yếu senior, 1 chuyện mid, chuyện "Dẫn dắt" có thể lead.

## Luật
- Đọc AGENTS.md. **Chỉ thêm** vào `js/data/star-stories.js`, không sửa mục khác, không sửa file khác.
- Cách thêm: viết các object (cách nhau bằng dấu phẩy) vào `logs/tmp-T1506.js` rồi `node scripts/qtool.js append js/data/star-stories.js logs/tmp-T1506.js`. Chuỗi bọc bằng dấu nháy kép; không backtick, không `${`.
- Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: TODO` → `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm `star-008` đến `star-013`; qtool check và `node scripts/validate.js` đều đạt.
Reviewed-by: verify-only (code/UI task)
