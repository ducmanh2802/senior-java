# T2794R — Fact-check nội dung mới của T2794

Status: DONE
Agent: opencode
Owns: `js/data/lessons-collections.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2794 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (trong file sở hữu `js/data/lessons-collections.js`):
- lesson-collections-015: hàm `freeSlot` trong body và reference không xử lý đúng khi khoảng bận chồng chéo (prompt đã nêu "các khoảng có thể chồng chéo"; mã cũ sai với trường hợp nested, ví dụ [100→900],[200→300], now=250). Sửa lại: dùng `headMap(cursor, true)` để nhảy con trỏ qua mọi đoạn chứa nó cho đến khi rảnh, rồi mới duyệt `tailMap`; đồng bộ body (~~~java) + reference + bước 1 của bài viết. Tất cả 6 test vẫn pass.
- lesson-collections-014 (nội dung HEAD, không sở hữu): khôi phục lại indent dòng `tags` (4 cách) mà bản T2794 đã nhầm đổi thành 2 cách, để diff chỉ chứa nội dung mới.

Không có lỗi kiến thức khác (TreeMap/NavigableMap, floor/ceiling/higher/lower, view subMap, comparator nhất quán equals, ConcurrentSkipListMap, modCount/CME, removeIf, fail-fast/fail-safe/weakly consistent đều đúng Java 17). lesson-collections-016 trùng nội dung lớn với lesson-collections-014 (fail-fast/CME) — ghi nhận, không xóa vì nằm ngoài phạm vi "sửa lỗi kỹ thuật".

validate.js: không báo lỗi nào về lessons-collections.js. Các lỗi còn lại (quiz-ops.js, lessons-jpa.js, lessons-payments.js, q-concurrency-jvm.js, q-spring-data.js…) nằm trong file không sở hữu, do các agent khác sửa, không được động theo luật 3 AGENTS.md. build-light-index.js không chạy được do lỗi cú pháp tại q-soft.js (file không sở hữu); index-light.js đã có lesson-collections-015/016 và metadata bài không đổi nên không cần sinh lại.

node scripts/test-lessons.js lesson-collections-015 → 6/6 + 6/6; lesson-collections-016 → 5/5 + 5/5 (starter không pass hết, reference pass 100%).
