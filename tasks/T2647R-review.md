# T2647R — Fact-check nội dung mới của T2647

Status: DONE
Agent: opencode
Owns: `js/data/quiz-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2647 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 2 lỗi kỹ thuật trong js/data/quiz-design.js:
1. **qz-design-091**: Sửa sai số tính dung lượng log. Câu hỏi gốc ghi "2 KB" nhưng đáp án 1,7 GB/ngày chỉ đúng với "2 bytes". Đã sửa câu hỏi thành "2 bytes" và cập nhật giải thích: `10.000 req/s × 2 bytes = 20 KB/s; × 86.400 s = 1.728.000 KB ≈ 1,7 GB`.
2. **qz-design-049**: Sửa typo "Alias (ase)" thành "Alias" trong Senior tip.
Chạy `node scripts/validate.js` → OK (không có lỗi mới cho quiz-design.js).
