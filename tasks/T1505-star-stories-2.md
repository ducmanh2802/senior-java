# T1505 — Câu chuyện STAR mẫu: star-002…star-007

Status: DONE
Agent: kilo
Owns: `js/data/star-stories.js`

Thêm **6 câu chuyện STAR mẫu** vào `js/data/star-stories.js`, id `star-002` … `star-007`. Người dùng là dev Java ~4 năm kinh nghiệm: họ chọn mẫu gần với dự án của mình rồi **sửa thành chuyện thật**, sau đó tập kể to khi phỏng vấn (tiếng Việt và tiếng Anh).

**Đọc kỹ trước:** chú thích schema ở đầu file và bài mẫu `star-001` (`node scripts/qtool.js show js/data/star-stories.js star-001`). Viết đúng chất lượng và độ cụ thể như vậy.

Tình huống (theme — nội dung):
1. Sự cố production — memory leak / OOM sau khi deploy, điều tra bằng heap dump
2. Hiệu năng — tối ưu query chậm (index, N+1) giảm p99 rõ rệt
3. Thiết kế — chọn Kafka/queue để tách hệ thống đồng bộ, xử lý idempotency
4. Deadline gấp — cắt scope có thương lượng để kịp go-live
5. Xung đột — bất đồng thiết kế với một senior khác, chốt bằng dữ liệu/PoC
6. Mentoring — kèm một junior từ chỗ hay gây bug đến tự review được

## Yêu cầu
- Mỗi chuyện là một dự án Java/Spring Boot điển hình ở Việt Nam (thương mại điện tử, ngân hàng, logistics, outsourcing Nhật/Âu-Mỹ, SaaS…), mỗi chuyện một bối cảnh khác nhau; không tên công ty thật, không tên người.
- **Kỹ thuật phải ĐÚNG** (Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL, Kafka, Redis, AWS hiện hành): metric, lệnh, config phải có thật; số liệu khớp nhau (làm phép tính).
- `action` kể từng bước cụ thể (công cụ, lệnh, quyết định và lý do); `result` có số đo được.
- `spoken` 150–260 từ tiếng Việt có dấu, giọng nói tự nhiên; `spoken_en` 130–220 từ, câu ngắn dễ nói (B1–B2), cùng nội dung.
- `adapt`: 3–5 hướng dẫn cụ thể người học cần thay gì để thành chuyện của mình (và cảnh báo phần interviewer sẽ hỏi sâu). `follow`: 2–4 câu hỏi đào sâu thật.
- Level: chủ yếu senior, 1 chuyện mid, chuyện "Dẫn dắt" có thể lead.

## Luật
- Đọc AGENTS.md. **Chỉ thêm** vào `js/data/star-stories.js`, không sửa mục khác, không sửa file khác.
- Cách thêm: viết các object (cách nhau bằng dấu phẩy) vào `logs/tmp-T1505.js` rồi `node scripts/qtool.js append js/data/star-stories.js logs/tmp-T1505.js`. Chuỗi bọc bằng dấu nháy kép; không backtick, không `${`.
- Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: TODO` → `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm star-002…star-007 theo sáu tình huống yêu cầu; build-light-index và validate hoàn tất.
Reviewed-by: verify-only (code/UI task)
