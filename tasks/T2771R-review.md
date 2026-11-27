# T2771R — Fact-check nội dung mới của T2771

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2771 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kiến thức ở nội dung mới (lesson-security-019 JWT, lesson-security-020 PBKDF2 login). Đã fact-check từng khẳng định kỹ thuật, tất cả đều đúng chuẩn Java 17 / Spring Security / RFC 7519 / OWASP:

- lesson-security-019: cấu trúc JWT header.payload.signature + Base64URL (-_ thay +/, bỏ =) đúng; HMAC-SHA256 ký trên header.payload; MessageDigest.isEqual hằng thời gian; thứ tự verify (cố định HS256 → tách 3 phần → chữ ký → exp/nbf+leeway → iss/aud) đúng; exp: now < exp (RFC 7519, bằng exp là hết hạn), nbf: now >= nbf; leeway 30–60s và clockSkew mặc định 60s của Spring Security (JwtTimestampValidator.DEFAULT_CLOCK_SKEW_SECONDS = 60) đúng; alg:none và alg confusion (RS256→HS256 ký bằng public key) mô tả đúng. Test 11/11 pass.
- lesson-security-020: equals/Arrays.equals thoát sớm ở byte khác đầu → timing attack đúng; MessageDigest.isEqual duyệt hết mảng tham số thứ nhất, đặt hash đã lưu làm tham số 1 đúng; PBKDF2WithHmacSHA256 qua SecretKeyFactory + PBEKeySpec + clearPassword đúng; đọc số vòng từ chuỗi đã lưu (rehash on login) đúng; dummy hash chống username enumeration đúng; split("$") là regex neo cuối chuỗi nên phải dùng indexOf đúng; OWASP khuyến nghị PBKDF2-HMAC-SHA256 ~600.000 vòng đúng. Test 8/8 pass.

Không sửa file (không có lỗi để sửa). Không thêm/xoá mục, không đổi văn phong.

Nghiệm thu:
- node scripts/validate.js: KHÔNG có lỗi nào thuộc lessons-security.js (các lỗi còn lại là của file khác đang được agent khác làm dở: quiz-ops, lessons-modern, lessons-jpa, lessons-api, lessons-payments, path.js — ngoài phạm vi task này).
- node scripts/test-lessons.js lesson-security-019 → RESULT 11/11; lesson-security-020 → RESULT 8/8 (reference pass hết, starter biên dịch được và không pass hết).
