# T129R — Fact-check nội dung mới của T129

Status: DONE
Agent: opencode
Owns: `js/data/q-kotlin.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T129 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed all 8 new questions (kotlin-011 through kotlin-018) added by T129. All are technically accurate for Java 17/21, Spring Boot 3.x, Hibernate 6, Kotlin 2.x. No markup errors found (no backticks in template literals, no unescaped `${`, proper `{{code}}` syntax). All answers have sufficient detail (1500-4000 chars), include **Tóm tắt**, structured `###` sections, code examples, tables where appropriate, and end with `> Senior tip:`. Level distribution appropriate (mid/senior/lead). No content duplication with existing questions. Validation passes with `OK — không có lỗi.`
