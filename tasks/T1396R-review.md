# T1396R — Fact-check nội dung mới của T1396

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1396 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- devops-101: xoá ký tự `"` dư ở đầu đáp án mẫu ("“Khi → “Khi); sửa thông báo PostgreSQL sai thành đúng: `null value in column "status" violates not-null constraint`.
- devops-102: xoá ký tự `"` dư ở đầu đáp án mẫu.
- devops-103: xoá ký tự `"` dư ở đầu đáp án mẫu.
- devops-104: xoá ký tự `"` dư ở đầu đáp án mẫu.
- devops-105: xoá ký tự `"` dư ở đầu đáp án mẫu.
- devops-106: xoá ký tự `"` dư ở đầu đáp án mẫu.
`node scripts/validate.js` → OK. Không còn lỗi kiến thức/markup trong phần mới.
