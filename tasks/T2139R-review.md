# T2139R — Fact-check nội dung mới của T2139

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2139 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff HEAD của `js/data/q-system-design.js` (phần T2139 thêm "### Ví dụ đời thực" và "### Trả lời mẫu khi phỏng vấn" cho nhiều câu sd-*).
- Kiểm tra kỹ thuật: không phát hiện API/flag bịa, mặc định sai, cơ chế nói ngược hay số liệu vô căn cứ trong phần mới. `node --check` pass.
- Sửa lỗi chính tả/markup/lẫn ngôn ngữ trong phần mới:
  - (sd-003, Ví dụ đời thực) "các request khác bị chök" → "các request khác bị nghẽn".
  - (sd-006, Trả lời mẫu) "độ tr_delay và độ tin cậy..." → "độ trễ (latency, thời gian chờ phản hồi) và độ tin cậy...".
  - (sd-006, Trả lời mẫu) "trùng_hiếm" → "trùng hiếm".
- `node scripts/validate.js` → OK. Không sửa nội dung đã có ở HEAD, không thêm/xoá mục. Chỉ sửa file sở hữu.
