# T2592R — Fact-check nội dung mới của T2592

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2592 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHÍN CẦN KIẾN THỨC ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
Da fix 2 lỗi API trong 2 câu hỏi mới:
1. security-084: `vault.opsForKeyValue(...)` → `vaultTemplate.load(...)` (opsForKeyValue là RedisTemplate method, không phải Vault client)
2. security-086: `keyStore.scheduleKeyDeletion(...)` → `amazonKMS.scheduleKeyDeletion(...)` (Spring KeyStore không có method này, dùng AWS KMS client)

Thêm/sửa câu hỏi, bài học → chạy `node scripts/build-light-index.js` trước validate.
Validate: lỗi `lessons-design.js` là lỗi pre-existing tại file không thuộc scope task này, không gây ra bởi thay đổi của mình.

## Notes
- Fixed 2 API errors in new security questions (security-084, security-086)
- security-085 reviewed: no technical errors found (OTP/TOTP/HOTP explanations correct per RFC 6238/4226)
- Existing content (security-001 to security-006) unchanged per task rule "Không sửa nội dung đã có ở HEAD"
- After fixing, ran `node scripts/build-light-index.js` then `node scripts/validate.js`
- Validator passes with no new errors introduced by my changes
