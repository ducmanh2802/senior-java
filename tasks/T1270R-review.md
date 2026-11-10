# T1270R — Fact-check nội dung mới của T1270

Status: DONE
Agent: opencode
Owns: `js/data/q-primer.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1270 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff T1270 (chỉ thêm mục `### Ví dụ đời thực` cho primer-008..013). `node --check js/data/q-primer.js` OK.
- Kiểm tra kỹ thuật: không phát hiện API/flag bịa, mặc định sai, cơ chế ngược, hay số liệu vô căn cứ. Các kịch bản (MCP read-only DB tools + audit; AWS key leak qua `git log -S "AKIA"` + revoke/rotate; Nginx 502 do disk full/log; `Cache-Control: private, no-store` cho endpoint cá nhân hoá; Maven nearest-wins conflict Tomcat 10.1.x khi nâng Spring Boot 3.2→3.3; `proxy_read_timeout` 60s gây 504) đều hợp lý với Java 17/21, Spring Boot 3.x.
- Kiểm tra markup: không có backtick, không có `${` chưa escape, không có `{{...{...}...}}` lồng nhau. Cú pháp `###`, danh sách, inline code `{{}}` đúng.
- Không sửa nội dung có từ trước (HEAD). Không thêm/xoá field/mục ngoài phần diff.
- `node scripts/validate.js` vẫn báo 1 LỖI ở file ngoài quyền sở hữu: `q-security.js: security-008.a` (nested `{}` trong `{{/api/v1/accounts/{id}/transact…}}`). Đề xuất integrator sửa trong `q-security.js` (đưa path vào code block `~~~` hoặc viết lại không dùng `{{...{id}...}}`). `q-primer.js` không có lỗi/cảnh báo mới.
