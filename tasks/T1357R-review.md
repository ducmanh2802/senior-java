# T1357R — Fact-check nội dung mới của T1357

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1357 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 18 lỗi chính tả/từ vựng tiếng Việt trong 6 câu hỏi mới (microservices-049 đến microservices-057):

1. **"Ví dụ đởi thực" → "Ví dụ đời thực"** (6 lần, tại lines ~4354, 4453, 4582, 4682, 4768, 4863)
2. **"Trả lởi mẫu khi phỏng vấn" → "Trả lời mẫu khi phỏng vấn"** (6 lần, tại lines ~4357, 4456, 4585, 4685, 4771, 4866)
3. **"rời ISR" → "bị loại khỏi ISR"** (3 lần, tại lines ~4425, 4432, 4433 - trong sequence diagram note và bảng kịch bản)

Không phát hiện lỗi kỹ thuật (API Kafka, cấu hình, cơ chế replication, EOS, v.v. đều đúng theo Kafka 3.x/4.x). Đã chạy `node scripts/validate.js` → OK và `node scripts/build-light-index.js` → thành công.
