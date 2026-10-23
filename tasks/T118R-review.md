# T118R — Fact-check nội dung mới của T118

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T118 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `english-052`: Gỡ các số liệu trình bày như sự thật không có nguồn; bổ sung outbox/idempotency và làm rõ saga không tạo ACID, xử lý fraud tùy yêu cầu đồng bộ.
- `english-053`: Bỏ incident hư cấu và ngưỡng pool cố định; yêu cầu xác minh timeline, nguyên nhân từ metric/database và bằng chứng trước khi khẳng định không mất dữ liệu.
- `english-054`: Sửa phép so sánh REST/Kafka quá tuyệt đối; Kafka không đảm bảo dịch vụ không lỗi, có điều kiện về capacity và chi phí vận hành.
- `english-055`: Bỏ hứa hẹn maintenance window/feature flag xóa rủi ro migration; đề xuất kiểm tra lock, thời lượng và tính tương thích trước khi chọn rollout.
- `english-056`: Bỏ lý do nghỉ việc và chi tiết ngân hàng/ledger/career path bịa; chuyển thành khung gắn với thông tin vai trò đã xác minh.
- `english-057`: Bỏ giả định mọi nơi có bonus/equity; khung lương dựa vào địa điểm, level và tổng đãi ngộ thực tế.
- `english-058`: Bỏ lời khuyên cấm hỏi nghỉ phép/lương ở vòng đầu; thay bằng chọn thời điểm phù hợp và câu kết không gây áp lực.
- `english-059`: Không phát hiện lỗi kỹ thuật đáng kể; câu trả lời có thể dùng như tình huống giả định và nhấn mạnh làm rõ giả định trước khi triển khai.
- `english-060`: Làm rõ nhãn nit/blocking phụ thuộc quy ước team, tránh giả định N+1 hay ngưỡng dữ liệu luôn là vấn đề.
- `english-061`: Bỏ thành tích/số liệu điểm yếu không có căn cứ; chuyển thành khuôn mẫu yêu cầu dùng trải nghiệm và bằng chứng thật.
- `english-062`: Bỏ kết quả mentoring 80%/3 tháng không có căn cứ; nhấn mạnh bằng chứng được phép chia sẻ, phạm vi an toàn và hỗ trợ phù hợp.
- `english-063`: Bỏ deadline, phân tách migration và tuyên bố không ảnh hưởng khách hàng như dữ kiện; chuyển thành khung yêu cầu nêu outcome có thật.
- Kiểm tra: `node --check js/data/q-english.js`, `node scripts/validate.js` (in `OK — không có lỗi.`), `git diff --check -- js/data/q-english.js`. Validator phát cảnh báo độ dài đáp án cho `english-055`–`english-063` nhưng không báo lỗi.
