# T2166R — Fact-check nội dung mới của T2166

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2166 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `lesson-security-010` (diff mới): sửa phần body verify/exp cho đúng RFC 7519 — nêu rõ `now >= exp` là hết hạn (đúng thời điểm `exp` cũng hết hạn) và `now < nbf` chưa hiệu lực; bổ sung nhấn mạnh "chỉ tin claim sau khi chữ ký hợp lệ". Sửa mô tả algorithm confusion HS256/RS256 cho chính xác (attacker ký HMAC bằng public key RSA công khai khi server nhầm đọc `alg` từ token). Sửa bài tập `Jwt.verify`: parse `alg` theo field (không dùng `contains`), kiểm chữ ký trước rồi mới đọc/so `exp`/`nbf`, dùng `nowEpochSec >= exp` và `nowEpochSec < nbf`, từ chối `HS512`/alg khác; cập nhật prompt/starter/tests/reference/hints/explain tương ứng (tests thêm case `now==exp`, HS512, alg parse theo field, payload rác/thiếu phần). Cập nhật check/related/tags giữ đúng kiến thức.
- `lesson-security-011` (diff mới): sửa PKCE cho đúng OAuth 2.1 — PKCE bắt buộc cho cả confidential client (không chỉ khuyến nghị); làm rõ PKCE không thay `client_secret` ở confidential client. Sửa body/exercise: xoá challenge sau exchange thành công, xử lý `verifier` null/rỗng trả null (không throw), verify thất bại không cho replay code, dùng `StandardCharsets.US_ASCII` cho verifier/challenge S256; cập nhật prompt/tests/reference/hints/explain và câu trả lời mẫu.
- `lesson-security-012` (diff mới): sửa kiến thức BCrypt — giới hạn 72 byte áp dụng cả `$2b$` (không chỉ phiên bản cũ); làm rõ ví dụ "giống 72 byte đầu" và không nhầm cắt khác nhau gây trùng hash tùy ý. Bổ sung ghi chú constant-time: `MessageDigest.isEqual` duyệt hết khi cùng độ dài; hash độ dài cố định nên khác độ dài chỉ là dữ liệu hỏng (trả false).
- Kiểm tra: `node --check js/data/lessons-security.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → OK. `node scripts/test-lessons.js --track security` in `Lesson exercises OK: 0/0 (0 bài học)` (không chạy được harness theo filter); không chạy full `scripts/test-lessons.js` vì lệnh bị ngắt trong môi trường chạy. Không git commit, không mở trình duyệt, không kill tiến trình theo tên.
