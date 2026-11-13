# T1532R — Fact-check nội dung mới của T1532

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1532 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed new content in js/data/q-ai.js: ai-059, ai-060, ai-061, ai-062, ai-063, ai-064 (topic ai, added after ai-058 at HEAD).
Không tìm thấy lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, hay chữ nước ngoài lẫn vào. Seq diagram (ai-059, ai-061, ai-063) hợp lệ (2–6 actor, bước ≤ 60 ký tự); mã Java minh hoạ tuân Java 17/Spring Boot 3.x. `node scripts/validate.js` → OK. Không cần sửa nội dung. Notes: không có lỗi.
