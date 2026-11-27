# T2777R — Fact-check nội dung mới của T2777

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2777 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Lỗi đã sửa (theo id bài học mới trong diff T2777):
- lesson-devops-025: reference `submit()` bắt `RejectedExecutionException` từ `pool.submit()` khi pool bị shutdown giữa lúc kiểm tra cờ `accepting` và gửi task (giảm `running` trước khi trả false, đồng bộ mẫu lesson-devops-023 đã có ở HEAD). reference `shutdown()` đọc `running.get()` TRƯỚC `pool.shutdownNow()` — đọc sau bị race: thread bị interrupt đã giảm bộ đếm trong `finally`, khiến `cancelled` sai (test "cancelled at least one" thất bại do cancelled=0).
- lesson-devops-026: không có lỗi kiến thức, markup, hay chữ nước ngoài lẫn vào.

Kết quả kiểm tra:
- `node --check js/data/lessons-devops.js`: OK.
- `node scripts/test-lessons.js lesson-devops-025`: 6/6 (lại 3 lần ổn định); `lesson-devops-026`: 6/6.
- `node scripts/validate.js`: lessons-devops.js KHÔNG LỖI. Các lỗi còn lại là của file khác (lessons-security, lessons-payments, projects, path, q-spring-data, lessons-spring, lessons-modern, lessons-jpa, q-concurrency-jvm, q-soft, quiz-ops, và lỗi cú pháp trước đó của q-security.js dòng 7709) — không thuộc quyền sở hữu task này, không đụng theo luật 3.
- `index-light.js`: vẫn stale — `node scripts/build-light-index.js` crash do lỗi cú pháp trước đó của q-security.js (backtick trong template literal), file không sở hữu, không thể sinh lại.
