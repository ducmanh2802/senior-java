# T2773R — Fact-check nội dung mới của T2773

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2773 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- sd-061 (Đặt phòng khách sạn): sửa chữ nước ngoài lẫn vào `争夺` → `tranh chấp` (2 chỗ: followup race condition và phần Tóm tắt). Sửa fence code `~~~lua` → `~~~text` vì `lua` không nằm trong danh sách ngôn ngữ markup hỗ trợ (`java|sql|yaml|json|bash|text`). Không lỗi kiến thức khác; số liệu ước lượng và cơ chế hold/lazy expiry/OTA sync đúng.
- sd-062 (Giao hàng chặng cuối): không có lỗi kiến thức. Giữ `H3 res 9 (~150m)` để nhất quán với nội dung đã có ở HEAD.
- node scripts/validate.js: file sd-problems.js không báo lỗi (các LỖI còn lại của repo nằm trong lessons-*/quiz-ops.js… của các task khác, đã có tại HEAD, không thuộc quyền sở hữu task này nên không sửa).