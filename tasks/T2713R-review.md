# T2713R — Fact-check nội dung mới của T2713

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2713 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review 2 bài mới (lesson-devops-023 graceful shutdown, lesson-devops-024 readiness vs liveness): nội dung kỹ thuật đúng (K8s grace period tính từ t=0 kể cả preStop, ENTRYPOINT shell nuốt SIGTERM, Spring shutdown thứ tự, HikariCP đóng sau drain, liveness KHÔNG kiểm tra DB, startup probe cho boot chậm, health group tách liveness/readiness). Không lỗi kiến thức/API/flag/markup/ngoại ngữ.

Lỗi đã sửa:
- lesson-devops-023 exercises[0] test "hết kết nối": race condition sau `release.countDown()` — submit ngay mà chưa đợi worker trả kết nối về pool. Thêm spin-wait `while (s.connectionsAvailable() < 1) Thread.yield();` trước submit tiếp. Sau sửa: 9/9 test pass.

Không chạy được `test-lessons.js` cho lesson-devops-024 do lỗi cú pháp trước đó trong `lessons-modern.js` (file không sở hữu, không liên quan). `validate.js` không báo lỗi nào trong `lessons-devops.js`. `index-light.js` đã chứa cả 2 lesson mới.
