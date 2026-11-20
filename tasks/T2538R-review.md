# T2538R — Fact-check nội dung mới của T2538

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2538 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review 2 câu mới của T2538 trong js/data/q-security.js (security-082 senior JWT vs session cookie, security-083 lead ID công khai/IDOR/cache penetration):
- Không tìm lỗi kỹ thuật: JWT verify cục bộ, denylist jti (TTL = exp − now), RS256/HS256, kiểm tra iss/aud, không tin alg trong header; session cookie HttpOnly/Secure/SameSite, xóa khóa Redis = thu hồi tức thì; refresh token rotation + phát hiện reuse → thu hồi chuỗi; IDOR qua findByIdAndUserId (WHERE id=? AND user_id=?), trả 404 cho cả "không tồn tại" và "không sở hữu"; Sqids chỉ làm mờ không mã hoá, UUIDv7 16 byte thời gian, cache negative TTL ngắn (5–10s), rate limit IP+user. Số liệu tham khảo là ước lượng kích thước cấp độ, không phải fact bịa.
- Không lỗi markup: không backtick, không `${` trong template literal; bảng và ~~~java hợp lệ.
- Id 082-083 không trùng, tăng dần sau security-071, level senior/lead phù hợp.
- node --check js/data/q-security.js: OK.
- node scripts/build-light-index.js: đã chạy (quy tắc 6).
- node scripts/validate.js: không báo lỗi nào về q-security.js. Còn LỖI pre-existing ở bugs.js (bug-047, bug-048: story/fix/hints/artifacts thiếu) — file không sở hữu (quy tắc 3), không được sửa, nên validate toàn repo không in OK.
