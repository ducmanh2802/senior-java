# T2616R — Fact-check nội dung mới của T2616

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2616 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- api-085: Sửa sai lệch về thời gian duyệt App Store/Google Play ("vài ngày đến hai tuần" → "thường mất vài giờ đến 1–2 ngày, trường hợp phức tạp có thể lâu hơn"); sửa mô tả không chính xác "đọc trường mới ra null" → "client strict parsing crash khi gặp trường lạ, hoặc hiển thị sai số dư do logic cũ không xử lý được giá trị mới".
- api-075: Sửa tương tự sai lệch "App Store review 1-2 tuần" → "App Store review thường vài giờ đến 1–2 ngày".
- api-086, api-087: Không phát hiện lỗi kỹ thuật. Nội dung đúng theo RFC 9457, HMAC-SHA256, key rotation, v.v.
