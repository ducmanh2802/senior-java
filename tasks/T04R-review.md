# T04R — Fact-check nội dung mới của T04

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T04 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- microservices-002, 005–010, 012–017, 019–028: rà soát refs mới; ba URL Spring Cloud, AWS Prescriptive Guidance và microservices.io đã được mở xác nhận tồn tại. Nội dung thân câu hỏi đều đã có ở HEAD nên không thay đổi.
- microservices-002, 005–010, 012–017, 019–028: sửa dấu CR lạc trước dấu phẩy ở 18 trường tags để trở về dấu phẩy kết thúc dòng chuẩn.
