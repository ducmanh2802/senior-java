# T144R — Fact-check nội dung mới của T144

Status: DONE
Agent: opencode
Owns: `js/views/speak.js`, `css/views/speak.css`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T144 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `js/views/speak.js`: `assessHTML()` bị lỗi logic nhánh — khi `kind === 'shadow'` rơi vào nhánh `else` (term) chỉ có 2 nút đánh giá (`known`/`review`) và thiếu `unknown`; đồng thời `shadowHTML()` không gọi `assessHTML()` nên tab Shadowing không có phần tự đánh giá. Đã sửa: đảo điều kiện (`kind === 'term'`) để `shadow` và `qa` cùng nhận 3 tùy chọn (`known`/`review`/`unknown`), và thêm `assessHTML(d, 'shadow')` vào `shadowHTML()`.
- `node --check` và `node scripts/validate.js` đều OK sau sửa.
- Không phát hiện lỗi API/flag bịa, số liệu vô căn cứ, hoặc chữ nước ngoài lẫn trong nội dung mới của file thuộc task này (`css/views/speak.css` sạch, không sửa).
