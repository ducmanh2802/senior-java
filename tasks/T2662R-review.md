# T2662R — Fact-check nội dung mới của T2662

Status: DONE
Agent: opencode
Owns: `js/data/quiz-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2662 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Nội dung MỚI (qz-autotest-051…060) đã được review kỹ. Kiến thức đúng, markup hợp lệ (không backtick, không `${`), mỗi explain có Tóm tắt + giải thích từng bước + ví dụ + Senior tip + mục vì sao các phương án còn lại sai. `node --check` → OK.
- 3/10 câu là `multi: true` (055, 056, 060) ≈ 1/4; `(Chọn 2)` đầy đủ; answer là mảng 2 index tăng dần, nằm trong range; options không trùng.
- Đáp án đúng rải đều vị trí: 051=2, 052=0, 053=3, 054=1, 055=[0,1], 056=[0,2], 057=2, 058=1, 059=3, 060=[0,2].
- `node scripts/validate.js`: file `quiz-autotest.js` **không có lỗi/warning nào** (autotest 45 câu hỏi → 60 trắc nghiệm). Các lỗi validate còn lại nằm ở `quiz-java.js` và `quiz-ops.js` — file của task khác, không thuộc sở hữu T2662R, nên không sửa theo luật 3 AGENTS.md.
- `node scripts/build-light-index.js` hiện tại lỗi syntax ở `js/data/sd-problems.js` (không phải file của T2662R). Đã kiểm tra: lỗi này **cũng có ở HEAD** (git stash → build → EXIT 0), nghĩa là không do nội dung mới của T2662R gây ra; integrator sẽ fix file sd-problems.js. `index-light.js` đã được build-light-index ghi lại từ lần chạy trước (không thay đổi so với dữ liệu hiện tại).
- Không commit.
