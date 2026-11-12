# T1528R — Fact-check nội dung mới của T1528

Status: DONE
Agent: opencode
Owns: `js/data/lessons-collections.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1528 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 2 bài học mới: lesson-collections-008 (MiniHashMap: hash spreading, bucket, collision, resize) và lesson-collections-009 (LinkedHashMap access-order: weighted LRU cache).

Kiểm tra kỹ thuật:
- Lesson 008: HashMap internals đúng chuẩn JDK 17/21 — hash spreading `h ^ (h >>> 16)`, bucket index `(n-1)&hash`, capacity lũy thừa 2, load factor 0.75, treeify threshold 8/64, resize gấp đôi dùng hash đã lưu. Reference implementation pass tất cả test (collision, resize, negative hash, null rejection).
- Lesson 009: LinkedHashMap access-order LRU có weight budget — get/put cập nhật recency, containsKey không, eviction vòng lặp iterator.remove() khi vượt budget, validate weight trước khi sửa map, totalWeight dùng long tránh tràn. Reference pass test multiple eviction, update key, invalid input rejection.

Markup: Tuân thủ spec ({{code}}, ###, ~~~java, |table|, >tip). Không có backtick, không có `${` trong template literal. Tiếng Việt toàn bộ, thuật ngữ kỹ thuật giữ nguyên tiếng Anh.

Chạy `node scripts/validate.js` → OK. Chạy `node scripts/test-lessons.js` → 225/225 exercises pass. Chạy `node scripts/build-light-index.js` thành công.

Không phát hiện lỗi kỹ thuật, markup, hay từ ngữ nước ngoài.
