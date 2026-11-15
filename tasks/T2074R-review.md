# T2074R — Fact-check nội dung mới của T2074

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2074 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Kiểm tra diff HEAD của `js/data/q-security.js`: các mục mới `security-061`..`security-066`.
- `security-061`: sửa lỗi gộp giới hạn ALB/CloudFront (trước ghi "ALB / CloudFront ... cỡ 16 KB, 400/431" không chính xác). Tách rõ: **AWS ALB** tổng header request tối đa ~16 KB (400/431), **CloudFront** giới hạn header request ~20 KB (400). Các mục `security-062`..`security-066` kiểm tra không thấy lỗi kỹ thuật/API/mặc định/markup/cú pháp cần sửa (Spring Security 6 `JwtTimestampValidator(Duration)`, prefix scope/role, `requireProofKey`/`reuseRefreshTokens`/PKCE, id_token vs access_token, RFC 8693 delegation `act` đúng).
- `node --check js/data/q-security.js` OK.
- `node scripts/validate.js`: không còn lỗi thuộc `js/data/q-security.js`; còn lỗi/ cảnh báo toàn repo thuộc file khác (bugs.js, lessons-banking.js, path.js, index-light.js…) ngoài phạm vi sở hữu, không sửa theo AGENTS.md.
