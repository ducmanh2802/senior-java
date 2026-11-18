# T2398R — Fact-check nội dung mới của T2398

Status: DONE
Agent: opencode
Owns: `js/data/lessons-collections.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2398 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `lesson-collections-010` (LinkedHashMap LRU cache + PriorityQueue min-heap Top-K): nội dung kỹ thuật đúng, không lỗi kiến thức. Đã fact-check kỹ:
  - `removeEldestEntry` được gọi sau mỗi `put`, eldest = entry ở đầu danh sách (access-order) → đúng.
  - `PriorityQueue` mặc định là min-heap, `peek`/`poll` O(log n) → đúng.
  - Top-K bằng min-heap kích thước K: O(n log k) thời gian, O(k) bộ nhớ → đúng.
  - `related` = ['collections-001', 'collections-005', 'collections-007'] — ba id đều có thật trong `js/data/q-java.js`.
  - `order: 10`, không trùng id, level `senior`, body 7581 ký tự, 3 check, 2 exercises.
- Chạy `node scripts/test-lessons.js lesson-collections-010` → 2/2 bài tập pass (4/4 + 4/4 test case), reference pass 100%, starter không pass.
- Chạy `node scripts/build-light-index.js` → ghi lại `js/data/index-light.js`.
- `node scripts/validate.js` → `OK — không có lỗi.` (exit 0).
- Không có lỗi markup, backtick, `${`, hay chữ nước ngoài lẫn vào. Không cần sửa nội dung đã có ở HEAD.
