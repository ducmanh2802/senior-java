# T1569R — Fact-check nội dung mới của T1569

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1569 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi kiến thức/markup. Đã fact-check 8 mục mới của T1569 (chỉ đọc `git diff HEAD -- js/data/q-java.js`):
- `core-043` equals/hashCode/compareTo: đúng (HashSet = hash+equals, TreeSet/TreeMap = compareTo==0; BigDecimal 2.0 vs 2.00 equals=false nhưng compareTo=0; record implements Comparable; Integer.compare chống overflow). "consistent with equals" giữ nguyên vì đã là thuật ngữ dùng ở HEAD (dòng 5901/5917/5945).
- `core-044` immutable + defensive copy: đúng (final không làm mảng bất biến; clone copy nông; List.copyOf shallow; unmodifiableList chỉ là view; safe publication của final field).
- `core-045` String/StringBuilder/StringBuffer: đúng (invokedynamic concat từ Java 9; StringBuffer đồng bộ từng method, không atomic cả chuỗi append).
- `collections-040` ConcurrentHashMap vs synchronizedMap: đúng (atomic theo key, iterator weakly consistent, cấm null key/value, callback computeIfAbsent nên ngắn, không atomic nhiều key/replica).
- `collections-041` PriorityQueue vs ArrayDeque: đúng (heap: peek O(1), offer/poll O(log n), remove O(n); ArrayDeque amortized O(1), cấm null; PriorityBlockingQueue unbounded; đổi priority sau enqueue làm sai heap).
- `modern-047` record/class/Lombok: đúng (record final, shallow immutable; @Data trên entity kéo lazy association → N+1/recursion).
- `modern-048` sealed + pattern switch: đúng (sealed chuẩn Java 17, pattern switch chuẩn Java 21; selector null → NPE trừ `case null`; `default` làm mất exhaustiveness; exhaustiveness compile-time không thay schema evolution).
- `modern-049` Stream peek/count/parallel: đúng (intermediate lazy, terminal short-circuit; count() có thể bỏ qua pipeline khi stream sized; peek không phải chỗ side effect bắt buộc; parallel lambda phải stateless/non-interfering; common ForkJoinPool nghẽn khi I/O; forEachOrdered giữ encounter order).

Kiểm tra: `node --check js/data/q-java.js` OK; 8 mục đủ field, độ dài đáp án 3947–4589 ký tự, 3 follow mỗi mục, không trùng id. `node scripts/validate.js` → **OK — không có lỗi** (các cảnh báo còn lại thuộc file khác: q-api.js, path.js — không thuộc phạm vi task). Không sửa nội dung ở HEAD, không thêm/xoá mục, không commit.
