# T1380R — Fact-check nội dung mới của T1380

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1380 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff T1380 trong `js/data/q-java.js` (phần mới thêm: `collections-033`, `collections-034`, `collections-035`, `modern-039`, `modern-042`, `modern-043`, `modern-044` — mỗi mục bổ sung `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn`).
- Lỗi kỹ thuật/markup đã sửa:
  - `collections-034`: sửa khai báo kiểu trong ví dụ đời thực bị thừa dấu `>` và sai value type so với mô tả — `{{HashMap<Long, Order>>> orderByUser}}` → `{{HashMap<Long, List<Order>> orderByUser}}`.
- Kiểm tra kỹ thuật các mục còn lại: nội dung mới về modCount/fail-fast, cache locality/Big-O/JMH, virtual thread (pinning `synchronized` trên Java 21, Semaphore/bulkhead JDBC, ScopedValue/ThreadLocal), text block/switch expression/var, record shallow immutability/compact constructor/DTO vs JPA entity, sealed+pattern matching exhaustiveness — phù hợp Java 17/21; không thấy API/flag bịa, cơ chế ngược, hay markup lỗi (không backtick, không `${`).
- Đã chạy `node scripts/build-light-index.js` theo quy định khi sửa nội dung câu hỏi; sau đó khôi phục `js/data/index-light.js` về HEAD vì file này ngoài phạm vi sở hữu của task.
- `node scripts/validate.js`: còn 3 LỖI có sẵn (không thuộc `js/data/q-java.js`, không do T1380R) trong `q-spring-data.js` (`db-036.a`, `db-037.a`, `db-038.a`: tiêu đề `###` bị thụt đầu dòng). Không sửa vì ngoài phạm vi sở hữu; cần task sở hữu `js/data/q-spring-data.js` xử lý để đạt OK toàn cục.
