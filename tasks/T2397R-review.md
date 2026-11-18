# T2397R — Fact-check nội dung mới của T2397

Status: TODO
Agent: opencode
Owns: `js/data/lessons-core.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2397 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

Status: DONE

## Notes

Đã review lesson-core-014 (lesson-core.js:2514-2739) — bài mới do model free viết.

- **Sửa 1 lỗi kỹ thuật nhỏ**: đoạn code ví dụ `### Ví dụ đời thực` dùng `new BigDecimal("10.000")` (giá trị 10, scale 3) nhưng comment và narrative nói 3333 mỗi kỳ (tức là 10.000 VND = 10000). Sửa thành `new BigDecimal("10000")` để code, comment và narrative nhất quán (10000 / 3 = 3333, dư 1).
- **Không có lỗi kiến thức khác**: equals/compareTo, HashSet vs TreeSet, HashMap, Money record với compact constructor chẩn hoa scale 2, compareTo so currency trước amount sau, các test case (1.005 → 1.01 HALF_UP, null check, currency validation) đều đúng.
- Kiểm tra: `node scripts/validate.js` → OK; `node scripts/test-lessons.js` → Lesson exercises OK: 328/328.
