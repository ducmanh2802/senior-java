# T2665R — Fact-check nội dung mới của T2665

Status: DONE
Agent: opencode
Owns: `js/data/lessons-modern.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2665 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 2 bài học mới (lesson-modern-008: Result type sealed interface, lesson-modern-009: Stream vs vòng for).
- lesson-modern-008: Sealed Result<T,E> với Ok/Err, map/getOrElse dùng instanceof pattern matching (Java 16+), compile và chạy đúng trên Java 17. Tests pass.
- lesson-modern-009: Giải thích overhead Stream, boxing, JMH; bài tập firstDuplicate dùng for + HashSet early exit. Tests pass.
Không phát hiện lỗi kỹ thuật, lỗi markup, hay thuật ngữ sai. Nội dung đúng chuẩn Java 17/21.
node scripts/validate.js → OK. node scripts/test-lessons.js → 383/383 pass. node scripts/build-light-index.js → OK.
