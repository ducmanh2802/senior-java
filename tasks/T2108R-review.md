# T2108R — Fact-check nội dung mới của T2108

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2108 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- microservices-088: sửa "dial dual write" → "đó là dual write" (từ lạ lẫn vào câu tiếng Việt).
- microservices-090: sửa "do proxy lo" → "do proxy làm" (từ bị cắt trong chú thích ~~~seq).
- Không tìm lỗi kiến thức kỹ thuật trong 5 câu mới (088–092): bảng sở hữu, BFF partial degradation, service mesh, trace ID vs business ID, Schema Registry đúng chuẩn Java 17/21, Spring Boot 3, Kafka 3.x.
- node --check OK, build-light-index.js đã sinh lại index-light.js, validate.js in "OK — không có lỗi."
Status: DONE