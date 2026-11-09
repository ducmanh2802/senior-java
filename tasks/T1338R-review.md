# T1338R — Fact-check nội dung mới của T1338

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1338 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review toàn bộ diff T1338 (90 dòng) trong js/data/q-system-design.js:
- Thêm markup {{...}} cho các thuật ngữ code (class, method, annotation, property) — cú pháp đúng, không backtick, không ${.
- Thêm section "Ví dụ đời thực" + "Trả lời mẫu" cho 5 câu hỏi (event-driven/Kafka, Spring Modulith, ACL/T24, @Transactional self-invocation, ArchUnit).
- Kiểm tra kỹ thuật: DefaultErrorHandler/DeadLetterPublishingRecoverer, ApplicationModules.verify()/FreezingArchRule/@ApplicationModuleTest, CoreBankingPort pattern, self-invocation bypass proxy + spring.aop.proxy-target-class=true + $$SpringCGLIB$$, ArchUnit noClasses()...dependOnClassesThat()/MapStruct/because() — đều đúng API, không bịa flag/mặc định/số liệu.
- Backtick trong diff chỉ nằm ở nội dung HEAD cũ (các dòng > Senior tip), không sửa theo quy tắc "không sửa nội dung đã có ở HEAD".
- validate.js → OK — không có lỗi.
