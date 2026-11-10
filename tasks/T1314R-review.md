# T1314R — Fact-check nội dung mới của T1314

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1314 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Phần mới thêm của T1314 nằm ở banking-025…029 (thêm mục "Ví dụ đời thực" + "Trả lời mẫu khi phỏng vấn", điều chỉnh một số Senior tip); banking-030…038 đã có ở HEAD, không đụng.

Lỗi đã sửa (chỉ phần mới thêm, theo id):
- banking-025: sửa chính tả "an_safe" → "an toàn" trong trả lời mẫu; `*timeout*`, `*retry kỹ thuật*`, `*retry nghiệp vụ*` → `**...**` (md() không hỗ trợ italic đơn `*`, sẽ render literal hoa thị).
- banking-026: `*nghiệp vụ*`, `*dữ liệu*`, `*hạ tầng*` → `**...**`.
- banking-028: `*giả định job sẽ chết giữa chừng và sẽ bị chạy lại*` → `**...**`.
- banking-029: `*quản lý biên*`, `*ngữ nghĩa dữ liệu*` → `**...**`.

Không tìm thấy lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup khác (backtick, `${`, `~~~seq`) hay chữ nước ngoài lạ trong phần mới thêm. Các `*` đơn còn lại (banking-027 line 2303, banking-028 line 2379) là nội dung HEAD, không được sửa.
node --check js/data/q-banking.js: OK. node scripts/build-light-index.js: OK. node scripts/validate.js: OK — không có lỗi.
