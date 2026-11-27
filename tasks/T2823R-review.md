# T2823R — Fact-check nội dung mới của T2823

Status: TODO
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2823 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed nội dung mới trong js/data/quiz-spring.js (qz-security-048 → qz-security-057, do model free viết), đối chiếu AGENTS.md mục 4–6 và chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x:

- Không có lỗi kỹ thuật: JWT claim exp hết hạn → 401 + WWW-Authenticate (qz-security-048); HttpOnly chặn JS đọc token, SameSite=Lax giảm CSRF nhưng không tuyệt đối, localStorage kém hơn (qz-security-049); OAuth2 state là nonce chống CSRF/login CSRF, riêng biệt với PKCE S256 (qz-security-050); BCrypt cứng 72 byte, cắt âm thầm, byte≠ký tự, pre-hash SHA-256+Base64 thoát mốc, Argon2id không giới hạn (qz-security-051); JWT alg:none chấp nhận token giả nếu server tin header alg, pin thuật toán qua NimbusJwtDecoder.withRsaPublicKey/withSecretKey (qz-security-052); MyBatis #{param} PreparedStatement an toàn, ${param} nối chuỗi nguy hiểm, ORDER BY động phải whitelist cột (qz-security-053); Broken Function Level Authorization, sửa @PreAuthorize("hasRole('ADMIN')") + @EnableMethodSecurity (qz-security-054); SameSite=Lax còn khe hở GET điều hướng top-level và same-site subdomain, kết hợp CSRF token (qz-security-055); CORS chỉ là chính sách trình duyệt, không xác thực, không chặn curl, ACAO * + credentials là tổ hợp sai (qz-security-056); redirect_uri phải exact match scheme+host+port+path theo RFC 6749, tránh prefix match (qz-security-057).
- Không lỗi markup: {{ }} khớp, \${} đã escape trong template literal, không backtick trong nội dung, fences ~~~ cân bằng, id đúng dạng qz-<topic>-NNN, multi answer khác nhau/tăng dần trong phạm vi options, q ghi "(Chọn 2)" khớp answer.length, không trường lạ.
- Không có chữ nước ngoài lẫn ngoài thuật ngữ kỹ thuật.
- Không chỉnh văn phong, độ dài, bố cục; không thêm/xoá mục (theo yêu cầu review).
→ Kết luận: không có lỗi.

BLOCKER (ngoài file sở hữu của task này): `node scripts/build-light-index.js` bị lỗi cú pháp tại js/data/quiz-design.js:4808 (hợp lệ ở HEAD, lỗi trong working tree do thay đổi của participant khác, task T2823R không sở hữu → không tự sửa). Do đó `node scripts/validate.js` vẫn báo `index-light.js` cũ và chưa in OK. Cần chủ sở hữu quiz-design.js sửa cú pháp, rồi chạy `node scripts/build-light-index.js` + `node scripts/validate.js` để hoàn tất nghiệm thu.

Status: DONE
