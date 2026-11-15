# T2122R — Fact-check nội dung mới của T2122

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2122 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã rà soát diff `HEAD -- js/data/q-soft.js`: thay đổi mới của T2122 chỉ là bổ sung tag `'core'` vào mảng `tags` của các câu hỏi hiện có (testing-001..010, behavioral-001..012, testing-051, testing-053, testing-058 và một số mục khác trong diff). Không có nội dung câu hỏi/đáp án mới, không có API/flag/cơ chế/số liệu/markup/chữ lạ cần sửa.
- Không có lỗi kiến thức.
- Đã chạy `node scripts/build-light-index.js` (do có thay đổi dữ liệu/tags) và `node scripts/validate.js` → OK.
