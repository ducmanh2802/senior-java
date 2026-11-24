# T2660R — Fact-check nội dung mới của T2660

Status: DONE
Agent: opencode
Owns: `js/data/lessons-collections.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2660 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa các lỗi sau trong 2 bài học mới:

**lesson-collections-011 (TreeMap):**
1. Ví dụ đời thực: "floorEntry(7) trả key 5" → sửa thành "floorEntry(7) trả key 0". Map tier có key 0,101,501,1001, không có key 5.
2. Phần 2 code tìm khung giờ trống: `tailMap(cursor, false)` → `tailMap(cursor, true)` (inclusive), thêm comment giải thích. Với `false` (exclusive) sẽ bỏ lỡ cuộc họp bắt đầu đúng lúc cursor.

**lesson-collections-012 (Iterator fail-fast):**
1. Thuật ngữ: Phân biệt rõ **fail-safe (snapshot)** cho CopyOnWriteArrayList vs **weakly consistent** cho ConcurrentHashMap (trước gom chung thành "fail-safe").
2. modCount: Sửa mô tả - ArrayList là `protected transient`, HashMap là `transient` (package-private), không phải cả hai đều protected.
3. Ví dụ đời thực: "admin cập nhật blacklist" (ngụ ý đa luồng) → "cùng luồng đó xóa IP khi đang duyệt" (CME là cơ chế single-thread).
4. Lỗi hay gặp: Cập nhật mô tả modCount cho đúng 2 class.
5. Trả lời mẫu phỏng vấn: Bổ sung phân biệt fail-safe (bản sao) vs weakly consistent (có thể thấy một phần thay đổi mới).
6. Markup: Thay backticks trong template literal bằng `{{code}}` (protected transient, transient, new ArrayList<>(list), removeIf) để tránh lỗi cú pháp.

Lesson tests: 381/381 pass. Validate script báo lỗi sẵn có ở labs-thread.js và path.js (không thuộc file sở hữu).
