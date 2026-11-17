# T2294R — Fact-check nội dung mới của T2294

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccap-2.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2294 (xem `git diff HEAD -- <file>`) do model free viết, ĐÃ review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHÍNH KIẾN THỨC: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. File quiz-ccap-2.js đã hợp lệ: format quiz đúng (id, options, answer, multi, (Choose N)), markup đúng, field lạ không có. Không có lỗi API/flag bịa, mặc định sai, cơ chế nói ngược, hoặc số liệu vô căn cứ. Không có lỗi markup, không có ký tự lạ. Content kỹ thuật đúng với Claude evaluation, governance, operational topics.

## Notes
validator OK — không có lỗi cần sửa.
