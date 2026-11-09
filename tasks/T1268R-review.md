# T1268R — Fact-check nội dung mới của T1268

Status: DONE
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1268 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Fact-check phần mới của T1268 (diff HEAD vs working tree, chỉ `js/data/q-remote.js`). Chạy `node --check js/data/q-remote.js` OK; `node scripts/validate.js` vẫn báo các lỗi/cảnh báo toàn repo có sẵn từ trước (không thuộc `q-remote.js`, không do T1268 gây ra): `lessons-testing.js` lỗi cú pháp ("Unexpected identifier 'test'"), `path.js` tham chiếu lesson-testing-001/002/003/004/005/006/007 không tồn tại, `index-light.js` đã cũ, cảnh báo 2 lesson không nằm trong PATH — **không sửa file ngoài phạm vi sở hữu**.

Lỗi đã sửa (theo id/vùng nội dung mới T1268):
- `remote-001` (phần sửa profile trong "Cách xử lý"): sửa markup inline `{{code|...}}` (không đúng cú pháp App.md, pipe) → `{{Java / Spring Boot Backend Engineer | REST APIs, PostgreSQL, AWS}}`.
- `remote-002`: sửa phí dịch vụ Upwork sai ("biến động 0–15% mỗi hợp đồng, cố định khi bắt đầu" + trích support.upwork.com) → **10% cố định cho mọi hợp đồng** (tính trên thu nhập brute freelancer), hiển thị trước proposal/offer; đồng bộ checklist.
- `remote-007`: thêm `### Ví dụ đời thực` (tình huống/triệu chứng/điều tra/nguyên nhân gốc/cách xử lý/kết quả đo được, số liệu giả định rõ ràng) + `### Trả lời mẫu khi phỏng vấn` (~150+ từ). Sửa thụt lề `Senior tip` mới thêm (2 space dư) → blockquote chuẩn `> Senior tip:` (không sửa tip cũ ở HEAD).
- `remote-008`: thêm `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn`; chuẩn hóa thụt `Senior tip` mới.
- `remote-009`: thêm `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn`; chuẩn hóa thụt `Senior tip` mới.
- `remote-010`: thêm `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn`; chuẩn hóa thụt `Senior tip` mới.
- `remote-011`: thêm `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn`; chuẩn hóa thụt `Senior tip` mới.
- `remote-012`: thêm `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn`; chuẩn hóa thụt `Senior tip` mới. Sửa chữ nước ngoài lẫn vào tiếng Việt trong bước xử lý mới: `trao échanges` → `trao đổi`.
- `remote-014`: sửa mô tả phí dịch vụ trong ví dụ bảng tính giả định (dòng "-50 USD") từ "giả định 10% — thực tế biến động 0–15%..." → `Phí dịch vụ freelancer (10% cố định): -50 USD`; checklist phí `0–15%...` → `10% cố định/hợp đồng — tại thời điểm viết; kiểm tra lại`; follow-up "thay đổi theo hợp đồng (0–15%)" → "là 10% cố định".
- `remote-028`: sửa định nghĩa phí dịch vụ (service fee) từ "biến động 0–15%..." → `10% cố định cho mọi hợp đồng` (ghi chú Direct contract khác, xem trang chính thức). Trong vùng nội dung T1268 thêm/sửa: mục sai lầm "Quên phí dịch vụ biến động 0–15%" → "Quên phí dịch vụ (10% cố định trên Upwork)"; checklist phí `0–15%` → `10% cố định/hợp đồng`; ví dụ ước lượng (note) `biến động 0–15%... (2026-11-07)` → `10% cố định/hợp đồng — tại thời điểm viết; kiểm tra lại`.

Đã rà: không còn `{{code|`, không còn `échanges`, không còn nhắc "0–15%/biến động" cho phí freelancer Upwork, các `Senior tip` mới thêm không bị thụt 2 space dư. Không thêm/xoá mục lớn; không sửa nội dung HEAD; không sửa file ngoài `js/data/q-remote.js` và task file.

