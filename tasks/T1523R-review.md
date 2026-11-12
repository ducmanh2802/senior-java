# T1523R — Fact-check nội dung mới của T1523

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1523 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 8 câu hỏi mới (collections-036 đến collections-039, core-039 đến core-042). Kiểm tra kỹ thuật: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x.
- collections-036: subList view behavior - chính xác
- collections-037: List<Integer>.remove(1) overload ambiguity - chính xác
- collections-038: computeIfAbsent atomicity Map vs ConcurrentHashMap - chính xác
- collections-039: synchronizedMap iteration cần sync thủ công - chính xác
- core-039: String.length() đếm UTF-16 code unit, emoji surrogate pair - chính xác
- core-040: Class identity = binary name + defining ClassLoader, TCCL purpose - chính xác
- core-041: int overflow two's complement wraparound, Math.multiplyExact - chính xác
- core-042: assert disabled by default, không dùng cho validation production - chính xác
Markup: không backtick, không ${, escape đúng. Không từ tiếng nước ngoài lẫn vào.
Kết luận: không có lỗi kiến thức, không có lỗi markup. Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
