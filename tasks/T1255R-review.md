# T1255R — Fact-check nội dung mới của T1255

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1255 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Review toàn bộ 6 mục `### Ví dụ đời thực` mới của T1255 (concurrency-007 virtual threads, concurrency-008 ThreadLocal, concurrency-009 CAS/LongAdder, concurrency-010 DCL, concurrency-011 synchronizers, concurrency-012 rate-limit thiết kế) trong `js/data/q-concurrency-jvm.js`: kiểm tra kỹ thuật (Java 17/21, Spring Boot 3.x, Kafka), markup (`{{code}}`, không backtick/`${`), và chữ nước ngoài lẫn vào.
- Lỗi kỹ thuật tìm thấy và đã sửa:
  - concurrency-011: `Semaphore(20) (quota 20 rps)` sai cơ chế — Semaphore giới hạn số call đồng thời, không phải quota rps. Đã đổi thành `Semaphore(20) (tối đa 20 call đang bay), kèm RateLimiter 20 rps để chặn burst`.
- Các mục còn lại (007, 008, 009, 010, 012): đúng kỹ thuật, số liệu minh hoạ tự nhất quán, không sửa thêm.
- Không sửa nội dung đã có ở HEAD, không thêm/xoá mục, không đụng file ngoài quyền sở hữu.
- Chạy `node scripts/build-light-index.js` (OK) rồi `node scripts/validate.js` → `OK — không có lỗi.`
