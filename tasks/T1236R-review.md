# T1236R — Fact-check nội dung mới của T1236

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1236 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã fact-check nội dung mới trong `js/data/q-java.js` (diff HEAD): các mục thêm `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn` cho `collections-001`, `collections-007`, `collections-008`, `collections-012`, `collections-013`, `collections-014`.
- Kiểm tra kỹ thuật (Java 17/21): ConcurrentHashMap Java 8 (CAS bucket rỗng, synchronized trên bin, volatile val/next, baseCount/CounterCell, null bị cấm, computeIfAbsent giữ lock bucket), CopyOnWriteArrayList/BlockingQueue (snapshot iterator, COW copy-on-write, bound/unbounded/OOM, SynchronousQueue handoff), footprint/boxing/primitive collections, WeakHashMap/IdentityHashMap semantics, TimSort/stability/Comparator contract, HashDoS/treeify (>=8, capacity>=64, untreeify 6). Không phát hiện API/flag bịa, mặc định sai, cơ chế ngược, hay số liệu vô căn cứ mang tính khẳng định sai.
- Kiểm tra markup/template: không có backtick, không có `${` trong nội dung thêm; dùng `{{}}`, `###`, list/code block hợp lệ. `node --check js/data/q-java.js` OK.
- `node scripts/validate.js` → OK (cảnh báo sẵn có ngoài phạm vi: `path.js` có 1 bài học không nằm trong PATH). Không chỉnh văn phong/bố cục/độ dài, không thêm/xoá mục, không sửa nội dung đã có ở HEAD.
- Kết luận: không có lỗi kiến thức cần sửa.
