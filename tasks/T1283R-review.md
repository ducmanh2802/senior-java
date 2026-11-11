# T1283R — Fact-check nội dung mới của T1283

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1283 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- q-soft.js: Tất cả 54 câu hỏi behavioral mới (behavioral-001 đến behavioral-054) và các "Ví dụ đời thực" đã được review kỹ. Không phát hiện lỗi kỹ thuật, markup, hoặc chữ nước ngoài lẫn vào.
- Các refs đến voz.vn (7 câu hỏi) đã được xác thực - URL thực tế tồn tại và chứa nội dung phỏng vấn Java/VN liên quan.
- Phát hiện và sửa 2 lỗi "ký tự lạ" (Korean "팀") trong q-aws.js (aws-013 và aws-014) - thay bằng "team".
- node scripts/validate.js → OK (chỉ cảnh báo pre-existing về lesson-design-007 không liên quan).
