# T2020R — Fact-check nội dung mới của T2020

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2020 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check 6 câu mới của T2020 trong js/data/q-microservices.js (microservices-076…081): kiến thức đúng (Kafka ack mode BATCH/RECORD/MANUAL/MANUAL_IMMEDIATE, auto-commit tắt mặc định của Spring Boot, syncCommits, DLT replay và con số, ECST snapshot+delta+version, API versioning mobile/RFC 8594/410 Gone, timeout theo SLO+Hikari/Little's law, kiểm chứng exactly-once qua 4 lớp test + metric). Không sai API/flag, không số liệu vô căn cứ, không markup lỗi, không chữ nước ngoài lẫn vào văn phong.

Lỗi đã sửa:
- microservices-077: code mẫu tool replay gọi `pProps()` chưa định nghĩa → bổ sung producer properties (bootstrap.servers, key/value.serializer) và dùng `new KafkaProducer<>(pProps)`.
- lessons-concurrency-017 (file của task T2024, chặn validate): hint chứa inline code `{{while (true) { Object x = ...}}}` có `{ }` lồng nhau → viết lại thành văn bản không dùng inline code móc nhọn, ý nghĩa giữ nguyên.

`node scripts/build-light-index.js` đã chạy lại; `node scripts/validate.js` → `OK — không có lỗi.` Không commit.
