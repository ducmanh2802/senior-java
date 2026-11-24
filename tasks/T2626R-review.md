# T2626R — Fact-check nội dung mới của T2626

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2626 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review 3 câu hỏi mới (aws-084, aws-085, aws-086) trong `git diff HEAD -- js/data/q-aws.js`. Không tìm thấy lỗi kỹ thuật (EKS control plane ~$73/tháng đúng, Fargate không cold start, Lambda cold start Spring Boot + connection pool đúng; DynamoDB partition limit 3000 RCU/1000 WCU, adaptive capacity, write sharding đúng; Aurora Global Database lag <1s, active-passive, Route 53 ARC đúng). Không lỗi markup (không backtick, không `${`, seq diagram đúng cú pháp). Không chữ nước ngoài lẫn vào. Không có `refs` nên không cần check-links. validate.js thoát mã 1 do lỗi cũ tại `bugs.js: bug-050` (ký tự "客服") — file không thuộc task này, không được sửa. `q-aws.js` sạch.
