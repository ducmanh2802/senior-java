# T2093R — Fact-check nội dung mới của T2093

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2093 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Khôi phục `js/data/quiz.js` từ HEAD (lần chạy trước T2093 bị gián đoạn gây lỗi cú pháp và nhét fragment sai vào file), sau đó append lại đúng 12 câu mới `qz-spring-054`..`qz-spring-065` từ `js/data/T2093_append.js` (đã xoá file tạm `quiz_test.js`, `T2093_append.js`).
- Fact-check kiến thức `qz-spring-054`–`qz-spring-065`: proxy/self-invocation @Transactional, propagation REQUIRED/REQUIRES_NEW/NESTED (savepoint), rollback behavior với REQUIRES_NEW, LazyInitializationException + JOIN FETCH/EntityGraph, request scope proxy trong singleton, @Async void + AsyncUncaughtExceptionHandler, HikariCP pool sizing/context switching, readOnly dirty checking, EAGER/N+1, executor queue behavior, connection leak/try-with-resources — **không có lỗi kỹ thuật**.
- `node --check js/data/quiz.js` OK. `node scripts/build-light-index.js` OK. `node scripts/validate.js` → `OK — không có lỗi.` (quiz 1352, spring 65). Chỉ sửa file sở hữu task (`js/data/quiz.js`) và task file; không commit.
