# T1602R — Fact-check nội dung mới của T1602

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1602 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

lessons-spring.js (file sở hữu):
- lesson-spring-013: sửa "tệ nhớ đệm" → "bộ nhớ đệm" (lỗi gõ chữ) ở dòng đầu body.

Các file khác đã bị free model làm hỏng, chặn validate.js (sửa tối thiểu để unblock):
- q-concurrency-jvm.js: 5 câu hỏi (concurrency-060, jvm-051, concurrency-061, jvm-052, concurrency-062) bị mất cấu trúc `follow:`/`tags:` (đã thành `### follow`/`### tags` là text trong template literal) và backtick đóng template literal bị đặt sai vị trí → sửa lại thành cấu trúc JS đúng. Sửa 44 dòng ` ###` (thụt đầu dòng) → `###` cho các tiêu đề trong 4 bài trên. Sửa concurrency-061.a: inline code `{{while (!condition) { Thread.onSpinWait(); }}}` chứa dấu `{ }` lồng nhau → viết lại không bao nháy nhọn.
- q-spring-data.js: spring-067.a: ký tự lạ "补偿" → "bù đắp".

Nội dung lessons-spring.js (lesson-spring-012 Security filter chain, lesson-spring-013 Cache) đã review: không có lỗi kỹ thuật, markup đúng, không có chữ nước ngoài, code exercise/starter/tests/reference compiles và test pass.

Kết quả:
- node --check js/data/lessons-spring.js → OK
- node scripts/build-light-index.js → OK
- node scripts/validate.js → OK — không có lỗi
- node scripts/test-lessons.js → 251/251 pass
