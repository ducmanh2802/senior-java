# T98R — Fact-check nội dung mới của T98

Status: DONE
Agent: opencode
Owns: `docs/market-layoffs-2026.md`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T98 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Thị trường: bổ sung xu hướng Java ITviec Q2/2025 (-4% YoY, +22% QoQ) và giới hạn rõ đây là lượng tin đăng nền tảng, không đại diện số tuyển dụng thật hay riêng cấp Senior.
- GoTymeX: thay liên kết Tyme Group cũ không truy cập được bằng thông cáo chính thức của Tyme Group ngày 17/12/2024; chỉnh liên kết tin Java API Engineer sang đường dẫn ITviec đang hoạt động.
- EPAM Vietnam: thay bản sao SEC qua CDN bằng hồ sơ 10-K trực tiếp tại SEC.gov. Các số liệu financial/report đã đối chiếu với nguồn doanh nghiệp tương ứng.
- Nghiệm thu: `node scripts/validate.js` → `OK — không có lỗi.`
