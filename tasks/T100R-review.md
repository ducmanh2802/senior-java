# T100R — Fact-check nội dung mới của T100

Status: DONE
Agent: opencode
Owns: `docs/market-jd-trends.md`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T100 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Bảng JD #4 (Rakuten): sửa mã tin Joboko trong URL từ `xvi6781992` sang `xvi6604295`; đối chiếu tiêu đề và mức 1.500–3.200 USD với tin được lập chỉ mục.
- Bảng JD #6 (VPBank): thay link trang kết quả tổng bằng link tin ID8750; đối chiếu Java, Spring Boot, Microservices.
- Bảng JD #12 (SHINHAN DS): sửa URL slug/mã tin thành đường dẫn trực tiếp đang được lập chỉ mục cho Senior Java Backend Developer.
- Các tỷ lệ kỹ năng và nhận định thị trường đã có giới hạn mẫu/snapshot trong báo cáo; không có dữ liệu tháng trước trong repo để xác thực xu hướng tăng giảm.
