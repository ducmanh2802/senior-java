# T1250R — Fact-check nội dung mới của T1250

Status: DONE
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1250 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (chỉ trong nội dung MỚI thêm vào js/data/q-remote.js của model free; nội dung HEAD giữ nguyên, không thêm/xoá mục):
- remote-005: "thiếu cách giao tiếp plan" → "thiếu kế hoạch giao tiếp"; "(weekly update + demo mỗi milestone)" → "(cập nhật hàng tuần + demo mỗi milestone)".
- remote-006: "current schema, version, hay số lượng data" → "schema hiện tại, phiên bản, hay số lượng dữ liệu"; "current schema, version Spring Boot, hay data volume" → "schema hiện tại, phiên bản Spring Boot, hay dung lượng dữ liệu"; "4–8 giờ assuming schema access and current version X" → "4–8 giờ, giả định có quyền truy cập schema và phiên bản hiện hành X"; "với estimated 6–8 giờ" → "với ước lượng 6–8 giờ"; "gửi tóm tắt written" → "gửi tóm tắt bằng văn bản".
- Không có lỗi markup (không backtick, không ${ trong đáp án), không số liệu vô căn cứ (tất cả là tình huống minh hoạ giả định), không API/flag bịa, cơ chế Upwork (Connects, escrow/milestone, non-circumvention) nêu rõ là có thể thay đổi và kiểm tra trang chính thức.
- node --check js/data/q-remote.js: OK. node scripts/validate.js: không báo lỗi về q-remote.js.
- Lỗi còn lại của validate.js (q-kotlin.js: kotlin-017.a có ký tự "显示") nằm trong file KHÔNG sở hữu bởi task này — không sửa theo quy tắc #3 AGENTS.md, ghi lại để integrator xử lý.
