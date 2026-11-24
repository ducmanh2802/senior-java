# T2593R — Fact-check nội dung mới của T2593

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2593 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Sửa lỗi schema trong phần mới của T2593 (topic `aws`, ids qz-aws-074..qz-aws-083):
- Thêm `id: 'qz-aws-078'`..`'qz-aws-083'` (topic: 'aws') cho 6 câu hỏi bị thiếu id → lỗi `(no id)`.
- Thêm `multi: true` cho qz-aws-078 (answer [0,2]) và qz-aws-083 (answer [0,1]) → validator yêu cầu multi: true khi answer là mảng.
- Kiểm tra kỹ thuật toàn bộ câu AWS mới: đúng (SQS visibility timeout/at-least-once, Kinesis retention, Lambda SnapStart/Provisioned Concurrency, RDS read replica async, S3 strong consistency, IRSA, Gateway vs Interface endpoint pricing, CloudWatch alarm states, Composite Alarm, SNS fan-out, Multi-AZ). Không lỗi markup, không chèn chữ nước ngoài.

id mới không trùng với HEAD (HEAD kết thúc qz-aws-054; T2593 dùng 055–083).

Chưa chạy `node scripts/build-light-index.js` để sinh lại `js/data/index-light.js`: script nạp hết data files nên bị crash do `js/data/sd-problems.js` có lỗi cú pháp (sở hữu của task khác, AGENTS.md quy tắc 3 — không được sửa). `index-light.js` vẫn cũ; sẽ cần chạy lại khi task khác sửa xong sd-problems.js.

Full `node scripts/validate.js` không thể đạt OK do 3 file khác có lỗi trong working tree (không sở hữu, không được đụng): `sd-problems.js` (SyntaxError), `quiz-java.js` (trùng id), `quiz-design.js` (field `level` không hợp lệ). `node scripts/validate.js quiz-ops.js` (file sở hữu) → OK, không lỗi.

## Nghiệm thu

node scripts/validate.js quiz-ops.js → OK (file sở hữu).
