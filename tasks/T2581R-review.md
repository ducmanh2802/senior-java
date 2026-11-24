# T2581R — Fact-check nội dung mới của T2581

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2581 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- qz-kotlin-024: sửa nhận định sai về trả về của scope functions (apply/also trả receiver, let/run trả lambda result) và explain tương ứng.
- validate.js không OK do lỗi cú pháp pre-existing ở js/data/lessons-aws.js (không thuộc sở hữu task này) và index-light.js cũ; đã thử build-light-index nhưng bị chặn bởi lỗi lessons-aws.js.
