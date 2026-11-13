# T2029R — Fact-check nội dung mới của T2029

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2029 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `qz-sql-025`: sửa lỗi kiến thức/đáp án — phương án 4 cũ thực chất đúng cú pháp/logic nên không thể là đáp án sai trong đề "chọn 2"; đã thay bằng truy vấn sai (dùng hàm tổng hợp `sum(price)` trong `WHERE`) và cập nhật giải thích cho đúng quy tắc `WHERE` vs `HAVING`.
- Đã chạy `node scripts/build-light-index.js` (do diff `js/data/quiz.js` làm `index-light.js` cũ).
- Kiểm tra kỹ thuật các câu mới `qz-sql-021` → `qz-sql-032`: không thấy lỗi API/flag/cơ chế/mặc định/số liệu sai hoặc markup/backtick/`${` theo phạm vi cần sửa.
- `node scripts/validate.js` hiện vẫn FAIL nhưng do lỗi pre-existing ngoài file sở hữu (`lessons-security.js`: lesson-security-013/015 inline code `{}` lồng nhau). Không sửa vì vi phạm quyền sở hữu file. Chạy `scripts/test-lessons.js` không áp dụng (task không sửa bài học).
