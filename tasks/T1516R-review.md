# T1516R — Fact-check nội dung mới của T1516

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1516 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- qz-cca-011: Sửa answer từ 3 → 1 (khớp với explanation "Đáp án đúng: B")
- qz-cca-020: Sửa answer từ 3 → 1 (khớp với explanation "Đáp án đúng: B")
- qz-cca-021: Sửa "Cinq trang web" → "Năm trang web" (loại bỏ từ tiếng Pháp lẫn vào)
- qz-cca-027: Sửa "sai_logic" → "sai logic" (typo)
