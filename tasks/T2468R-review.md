# T2468R — Fact-check nội dung mới của T2468

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2468 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check toàn bộ phần T2468 thêm/sửa trong `js/data/q-java.js`: collections-057 được viết lại có dấu, 16 câu khác chỉ đổi `**Tom tat:**` → `**Tóm tắt:**`. Các câu còn lại không có nội dung mới.

Lỗi đã sửa (collections-057):
- **CopyOnWriteArrayList bị xếp sai nhóm**: câu cũ ghi "không implement SequencedCollection". Thực tế `CopyOnWriteArrayList` là `List`, mà `List extends SequencedCollection` từ Java 21, và nó có `addFirst/addLast/getFirst/getLast/reversed`. Đã chuyển sang nhóm implementer, ghi rõ mỗi lần `addFirst`/`addLast` phải sao chép toàn bộ mảng nên O(n), không hợp chèn/xoá ở đầu liên tục.
- **Set.of bị nói là implement SequencedCollection**: `Set.of` trả về set bất biến **không có thứ tự**, không phải `SequencedSet` nên không có `getFirst`/`addFirst`. Đã sửa: chỉ `List.of` implement `SequencedCollection` (và `addFirst`/`removeFirst` ném `UnsupportedOperationException`).
- **Định nghĩa sai**: "Collection là lớp" (Collection là interface/khái niệm tập hợp) và "interface (giao thức)" (interface là "giao diện"), kèm câu ví dụ vô nghĩa "như hợp đồng trong điện thoại, các ứng dụng phù hợp phải hỗ trợ công thức đó". Đã viết lại ngắn, đúng nghĩa.
- **Lỗi chính tả lặp từ**: "ném neu neu" → "ném nếu" (nằm trong chính diff T2468 nên đã sửa).

Đã kiểm tra đúng, giữ nguyên: `getFirst`/`getLast` ném `NoSuchElementException` khi rỗng; các thao tác thêm/xoá đầu-cuối là optional method; `reversed()` trả view chứ không sao chép; danh sách method của `SequencedMap` (firstEntry/lastEntry/firstKey/lastKey/putFirst/putLast/reversed/sequencedKeySet/sequencedValues/sequencedEntrySet); `List`/`Deque`/`LinkedHashSet`/`LinkedHashMap`/`TreeSet`/`TreeMap` implement; `HashSet`/`HashMap`/`ConcurrentHashMap` không implement; `SequencedCollection` không extends `Deque` nên không có `push`/`pop`; JEP 431 đúng; refs JEP 431 hợp lệ. Không có chữ nước ngoài (CJK/Cyrillic) trong file.

Nghiệm thu: `node --check js/data/q-java.js` OK; `node scripts/validate.js q-java.js` → `OK — không có lỗi.` Không cần chạy `build-light-index` vì id/topic/level không đổi.
Lưu ý: `node scripts/validate.js` (toàn bộ) hiện vẫn báo LỖI ở `js/data/lessons-spring.js` (lesson-spring-024/027/028/029/030) — file của task khác đang dở, ngoài quyền sửa của task này.
