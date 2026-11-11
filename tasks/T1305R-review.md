# T1305R — Fact-check nội dung mới của T1305

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1305 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review `git diff HEAD -- js/data/q-java.js`: T1305 thêm `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn` cho `collections-015`, `collections-016`, `collections-017`, `collections-018`, `modern-011`, `modern-012`.
- `collections-015`, `collections-016`, `collections-018`, `modern-011`, `modern-012`: không phát hiện lỗi kỹ thuật/markup/chữ lẫn so với chuẩn (ConcurrentHashMap bin-locking Java 8+, HashSet/HashMap + mutable key, Arrays.asList view/fixed-size/primitive boxing, Stream.toList vs Collectors mutability/null/type inference, JDK HttpClient timeouts/status behavior, RestClient trên Spring Boot 3.2+).
- `collections-017` (sửa kiến thức sai): phần "Ví dụ đời thực" mô tả sai cơ chế khi `list.remove` trong for-each (CME ném ở `next()` do `modCount`, không phải "xoá phần tử ở giữa làm con trỏ iterator bằng kích thước danh sách, hasNext trả false kết thúc sớm"). Đã sửa lại mô tả cho đúng cơ chế fail-fast/CME và hậu quả khi bắt exception sai. Cập nhật "Trả lời mẫu khi phỏng vấn" để bỏ mô tả sai tương tự và nêu đúng hạn chế của `CopyOnWriteArrayList.iterator().remove()` (UOE).
- Đã chạy `node --check js/data/q-java.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo có sẵn: `lesson-design-007` không nằm trong PATH). Không chạy `node scripts/test-lessons.js` vì không sửa bài học.
