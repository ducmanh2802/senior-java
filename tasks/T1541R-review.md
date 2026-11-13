# T1541R — Fact-check nội dung mới của T1541

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1541 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã fact-check diff mới T1541 trong `js/data/labs-incident.js` (`lab-incident-027`, `lab-incident-028`, nối tiếp sau `lab-incident-026`).
- Kiểm tra tính nhất quán artifact/answer: timeline, request/ticket/order/refund id, token và phép tính chi phí (720+1200+1200=3120 calls; 6.24M input, 1.248M output; 8.64+14.40+14.40=37.44 USD; 864.20/24.80≈34.8x), trạng thái `accepted` chưa khẳng định tiền đã về, phân biệt rõ prompt injection (tác nhân kích hoạt) vs thiếu authorization/policy/human approval ở server/tool boundary. Không phát hiện API/flag bịa, cơ chế nói ngược, số liệu vô căn cứ hay lỗi markup; không sửa nội dung.
- `node scripts/validate.js` → `OK — không có lỗi.` (lab-incident 027, 028 có trong diff, tổng 28 bài incident theo thống kê).
