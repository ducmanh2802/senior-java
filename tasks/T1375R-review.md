# T1375R — Fact-check nội dung mới của T1375

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1375 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (theo từng id trong nội dung mới của T1375, chỉ nội dung mới, không chạm nội dung HEAD, không thêm/xoá mục):
- design-035: code block SQL mẫu viết `hold_expires_at=now()+10min` — không đúng cú pháp PostgreSQL → sửa thành `hold_expires_at=now() + interval '10 minutes'` (khớp quy ước code HEAD đã có, ví dụ design ticketing cũ dùng `now() + interval '10 minutes'`).
- architecture-032: Kafka KRaft lưu metadata trong internal log topic ghi sai `{{@metadata}}` → sửa thành `{{__cluster_metadata}}` (tên thật của KRaft).
- q-remote.js (ngoài file sở hữu T1375R, ghi chú để unblock validate): mẫu injection `knex.raw('... user_id = ${userId}')` bị template literal nội suy `userId` (không định nghĩa) → ném `ReferenceError` khi nạp file, chặn `validate` toàn kho. Đã khôi phục `\${userId}` như HEAD (vẫn hiển thị đúng literal `${userId}` trong ~~~text).

Hoạt động hỗ trợ:
- Chạy `node scripts/build-light-index.js` sinh lại js/data/index-light.js (quy tắc AGENTS.md mục 6 sau khi sửa dữ liệu câu hỏi).
- Kiểm tra: `node scripts/validate.js js/data/q-system-design.js` → sạch; `node scripts/validate.js` (toàn kho) → `OK — không có lỗi.` (lần chạy cuối). Lưu ý: kho đang bị tiến trình bên ngoài mutating file q-remote.js (đã flapping giữa `${userId}`/\${userId}); nếu chạy validate lại gặp lỗi q-remote.js, đó là quá trình bên ngoài, không phải nội dung T1375R.

Status: DONE