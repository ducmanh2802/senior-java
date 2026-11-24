# T2670R — Fact-check nội dung mới của T2670

Status: DONE
Agent: opencode
Owns: `js/data/lessons-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2670 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check nội dung mới của T2670 (lesson-aws-007..012: SQS standard/FIFO/message timer, S3 multipart/presigned/conditional write). Đối chiếu AWS docs hiện hành.

Lỗi kỹ thuật đã sửa:
- **lesson-aws-009** (SQS FIFO): số liệu throughput sai. Bản gốc ghi "300 msg/s mặc định, 3000 với high-throughput FIFO" và bảng "300 msg/s (3000 high-throughput)". Thực tế theo AWS: mặc định 300 TPS mỗi API action (không batching); 3.000 msg/s là throughput khi **dùng batching** ở chế độ thường (300 call × 10 msg); **high-throughput mode** là tính năng riêng, cao hơn nhiều (tới 70.000 TPS/API action ở một số region). Đã sửa cả câu tóm tắt lẫn ô bảng thành "300 TPS/API action (3.000 msg/s khi batching)" và ghi chú high-throughput mode cao hơn.

Không tìm thấy lỗi kỹ thuật/markup/chữ nước ngoài nào khác ở lesson-aws-007, 008, 010, 011, 012. Các số liệu còn lại đều đúng: single PUT 5 GB; part 5 MiB–5 GiB, tối đa 10.000 part, phần cuối không giới hạn nhỏ; visibility timeout mặc định 30s tối đa 12h; DelaySeconds 0–900s; FIFO dedup 5 phút; presigned URL SigV4 tối đa 7 ngày; ETag multipart = MD5(nối raw digest 16 byte các part theo thứ tự) + "-N"; conditional write If-None-Match:* trả 412; SSE-KMS ETag không phải MD5.

Kiểm chứng:
- `node --check js/data/lessons-aws.js` → SYNTAX OK.
- 6/6 bài tập (lesson-aws-007..012) pass: reference pass hết test, starter biên dịch được và không pass hết (chạy bằng runner tạm chỉ nạp lessons-aws.js).
- `node scripts/validate.js`: **không có lỗi nào thuộc lessons-aws.js**. Các lỗi còn lại thuộc file của task khác đang làm dở (lessons-design.js lỗi cú pháp, lessons-jvm.js, path.js) và index-light.js cũ — `build-light-index.js` bị chặn bởi chính lỗi cú pháp lessons-design.js, nên không regenerate được (không sửa file ngoài quyền sở hữu).
