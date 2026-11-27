# T2827R — Fact-check nội dung mới của T2827

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2827 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. Đã review 3 câu hỏi mới (behavioral-087, behavioral-088, behavioral-089):
- behavioral-087 (senior): Xử lý bất đồng với tech lead về Kafka vs REST cho luồng đặt hàng. Kỹ thuật chính xác: Kafka consumer poll latency, duplicate message/idempotency, DLT, schema registry; REST sync phù hợp volume thấp. Số liệu thực tế (300 đơn/giờ, p99 latency, 15% growth).
- behavioral-088 (lead): Nhận legacy system (Spring Boot 1.5, Oracle 12) không test, sửa báo cáo 2 tuần. Dùng characterization/approval test, canary 5%, tìm lỗi làm tròn 0.3%. Phương pháp đúng chuẩn.
- behavioral-089 (senior): Mentoring junior code chậm (N+1, load all to RAM) và bug production (null, exception). Dùng EXPLAIN ANALYZE, index, performance test, checklist merge. Kết quả đo được (12s→1.8s, 5/quý→1 bug).
Tất cả markup hợp lệ ({{code}}, ###, >), không backtick/${ trong template literal, thuật ngữ tiếng Anh giữ nguyên theo quy ước.
