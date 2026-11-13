# T1546R — Fact-check nội dung mới của T1546

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1546 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- sd-027: sửa mẫu Redis Lua token bucket đang nhận thời gian từ app (`now_ms`/ARGV) dù rubric/text yêu cầu dùng thời gian Redis để tránh clock skew; script giờ lấy thời gian bằng `redis.call('TIME')` trong Redis, đổi tham số còn `capacity, refill, cost` và bổ sung giải thích tính atomic của Lua script.
- sd-028: sửa ví dụ cursor pagination đang mâu thuẫn hướng đọc feed mới-nhất-trước (mô tả/điều kiện `score < lastScore` nhưng minh hoạ `ZRANGEBYSCORE -inf..lastScore` và khởi tạo cursor bằng thời gian hiện tại) có thể bỏ sót/trùng trang; đổi sang hướng lấy trang cũ hơn cursor với `ZREVRANGEBYSCORE` từ `maxScore` xuống, giải thích rõ quy ước so sánh score/postId khi trùng score.
- sd-029: không có lỗi kỹ thuật phát hiện.
- sd-030: không có lỗi kỹ thuật phát hiện.
- Kiểm tra: `node --check js/data/sd-problems.js` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` → "OK — không có lỗi." (chỉ còn cảnh báo sẵn có về lessons không nằm trong PATH).
