# T2632R — Fact-check nội dung mới của T2632

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2632 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 10 câu MỚI (qz-core-055 … qz-core-064). Sửa 2 lỗi kiến thức:

- **qz-core-056** (String): câu hỏi "Chọn 2" nhưng có **3** đáp án đúng (0 immutable, 1 literal pool ở heap Java 7+, 2 phép + tạo String mới); đáp án cũ [0,2] sai logic + explain mâu thuẫn. Đã đổi thành "Chọn 3", answer [0,1,2], viết lại explain (option substring sai vì JDK 6 share mảng, JDK 7+ chỉ copy range).
- **qz-core-059** (checked vs unchecked): "Chọn 2" nhưng có **3** đáp án đúng (0 checked extends Exception, 1 unchecked extends RuntimeException, 2 checked bắt buộc catch/throws); đáp án cũ [0,2] sai logic. Đã đổi thành "Chọn 3", answer [0,1,2], viết lại explain (option "checked luôn là bug" sai).

Các câu còn lại (055, 057, 058, 060, 061, 062, 063, 064) đúng kỹ thuật, giữ nguyên.

Nghiệm thu: `node --check js/data/quiz-java.js` OK; `node scripts/validate.js` không còn lỗi nào thuộc quiz-java.js.

LƯU Ý (không thuộc quyền sở hữu, không tự sửa): `node scripts/validate.js` vẫn báo 2 lỗi ở file khác:
- lessons-jpa.js: lesson-jpa-020 body < 2500 ký tự (1084)
- lessons-jvm.js: lesson-jvm-004 related "jvm-032" không tồn tại
→ đề xuất integrator/task chủ sở hữu (T2686 lessons-jpa, T2716 lessons-jvm) xử lý.
