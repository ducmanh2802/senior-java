# T1342R — Fact-check nội dung mới của T1342

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1342 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã fact-check nội dung mới trong `js/data/q-soft.js` (diff HEAD): `behavioral-023`–`behavioral-028` (bổ sung các mục `### Ví dụ đời thực` và/hoặc `### Trả lời mẫu khi phỏng vấn`).
- Không phát hiện lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế sai), lỗi markup (backtick, `${`), hay chữ nước ngoài không phù hợp trong các mục mới. Không chỉnh sửa nội dung.
- `node --check js/data/q-soft.js`: OK.
- `node scripts/validate.js`: CHƯA OK toàn repo do lỗi/cảnh báo có sẵn ngoài phạm vi file sở hữu (nhiều lesson/question tham chiếu trong `path.js` không tồn tại, và `index-light.js` cũ). Không sửa file ngoài `js/data/q-soft.js` theo luật task. Cần integrator xử lý các lỗi này để đạt `OK — không có lỗi.` toàn cục.
