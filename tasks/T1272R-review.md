# T1272R — Fact-check nội dung mới của T1272

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1272 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- modern-008 (Collectors): sửa chữ `{{groupingBy(Order::getEmail, toList()))}}` thừa dấu `)` → `toList())`; sửa lỗi kỹ thuật: "classifier null khiến {{computeIfAbsent}} ném NPE" chưa chính xác (máy kiểm thử JDK 17: HashMap.computeIfAbsent(null) **không** ném NPE; NPE của groupingBy đến từ `Objects.requireNonNull(key)` trong accumulator, message "element cannot be mapped to a null key") → viết lại "classifier trả null gây NPE (key null) và hủy toàn bộ stream". Trả lời mẫu giữ nguyên (mô tả đúng hiện tượng: pipeline dừng do NPE).
- modern-009 (SequencedCollection): "plus kiểm tra {{isEmpty()}}" → "và kiểm tra" (bỏ từ lạ tiếng Anh).
- modern-009, modern-010, core-018 (NIO transferTo), core-019 (String concat/invokedynamic), core-020 (4 tính chất OOP): kiểm tra kỹ thuật OK, không sửa.
- Không chạm nội dung đã có ở HEAD; không thêm/xoá mục; không backtick/`${` trong các đoạn mới.
- `node --check js/data/q-java.js`: OK. Không có lỗi validate.js liên quan đến q-java.js.
- `node scripts/validate.js` **chưa in OK do lỗi trước đó của tôi không sở hữu**: `js/data/q-spring-data.js` có lỗi cú pháp template literal (dấu `` ` `` thô) → `build-light-index.js` crashes → `index-light.js` báo cũ; thêm lỗi không liên quan trong `lessons-sql.js`, `projects.js`, `path.js`. Theo luật 3 AGENTS.md, tôi không sửa file ngoài quyền sở hữu (`js/data/q-java.js`).
