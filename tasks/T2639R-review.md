# T2639R — Fact-check nội dung mới của T2639

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2639 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 3 câu hỏi mới (collections-058, collections-059, collections-060) trong js/data/q-java.js.

Lỗi đã sửa (1):
- collections-060 (js/data/q-java.js:13856): Sửa lỗi kỹ thuật — câu ghi "{{List.of}} không implement {{RandomAccess}}" là SAI. Thử thực tế trên JDK 17: List.of("a","b") instanceof RandomAccess → true. Oracle docs (List (Java SE 21)) ghi rõ "The lists and their subList views implement the RandomAccess interface." Sửa thành "{{List.of}} implement {{RandomAccess}}, nên truy cập index O(1) (backing là mảng)."

Các câu còn lại (collections-058 LinkedHashMap LRU thread-safe, collections-060 top-K HashMap + PriorityQueue) đã kiểm tra kỹ thuật:
- collections-058: đúng về LinkedHashMap accessOrder, modCount fail-fast, ConcurrentModificationException, Caffeine W-TinyLFU, striped locking. Đã verify Caffeine wiki URL (github.com/ben-manes/caffeine/wiki) — tồn tại.
- collections-059: đúng về PriorityQueue không thread-safe, offer(null) throws NPE (verified), Count-Min Sketch, top-K gộp phải cộng dồn trước. Đã verify PriorityQueue API URL (docs.oracle.com/.../PriorityQueue.html) — tồn tại.
- collections-060: đúng về List.copyOf trả chính list bất biến (verified: copyOf(immutable) == same → true), Collections.unmodifiableList là view (verified), List.of cấm null. Đã verify List API URL (docs.oracle.com/.../List.html) — tồn tại.

Lưu ý: node scripts/validate.js hiện có lỗi pre-existing từ công việc song song khác (q-devops.js có cú pháp sai, không phải file của task này). File js/data/q-java.js đã pass node --check. Sau khi các agent khác sửa xong q-devops.js, cần chạy lại build-light-index.js + validate.js để có OK hoàn toàn.
