# T1362R — Fact-check nội dung mới của T1362

Status: DONE
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1362 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ nội dung mới thêm vào q-remote.js (các section "Cơ chế", "Ví dụ đời thực", "Trả lời mẫu khi phỏng vấn" được thêm vào câu hỏi remote-049 đến remote-054).
- Không phát hiện lỗi kỹ thuật: thuật ngữ (CEFR, p95, N+1, idempotent, AWS S3, Kafka, Kubernetes, observability, v.v.) đúng chuẩn Java 17/21, Spring Boot 3.x.
- Không phát hiện lỗi markup: không có backtick ` ` ` trong template literal, không có `${` chưa escape, cú pháp `###`, `-`, `|`, `~~~` đúng quy ước.
- Không phát hiện chữ nước ngoài lẫn vào: nội dung tiếng Việt, thuật ngữ kỹ thuật giữ nguyên tiếng Anh theo quy định.
- `node scripts/validate.js` chạy OK (không có lỗi liên quan q-remote.js).
Không cần sửa file nào.
