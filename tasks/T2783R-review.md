# T2783R — Fact-check nội dung mới của T2783

Status: DONE
Agent: opencode
Owns: `js/data/labs-thread.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2783 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review nội dung mới của T2783 trong `js/data/labs-thread.js` (labs lab-thread-034 và lab-thread-035, phần thêm vào sau lab-thread-033):
- lab-thread-034 (parallelStream + @Transactional nghẽn commonPool và Hikari): đúng kỹ thuật, artifact/đáp án nhất quán, markup sạch, không lỗi.
- lab-thread-035 (deadlock AB-BA bằng ReentrantLock): ĐÃ SỬA lỗi ánh xáo khoá trong đáp án — trước đây viết "transfer-1 giữ <0x...d0a0> chờ <0x...d8f8>" bị ngược so với artifact (artifact cho transfer-1 locked <0x...d8f8>, waiting <0x...d0a0>). Đã chỉnh đáp án khớp artifact và đúng thứ tự khoá theo code (transfer-1 khoá W1001 trước).
- validate.js: không báo lỗi nào cho labs-thread.js. node --check OK.
- Các LỖI còn lại của validate.js (q-security, quiz-ops, lessons-*, path.js, index-light cũ…) nằm trong file KHÔNG sở hữu của task này, đã có sẵn trước, không được touche theo quy tắc task.