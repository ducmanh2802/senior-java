# T1351R — Fact-check nội dung mới của T1351

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1351 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ 130 scenarios trong q-scenario.js (scenario-001 đến scenario-130). Kiểm tra:
- Không có backtick (`) trong template literals
- Không có `${` không escape (chỉ có `\${HOSTNAME}` ở line 3503 đã đúng)
- Markup ~~~ code blocks đúng cú pháp (sql, java, text, yaml, seq)
- API/flags đúng: Kafka 3.x/4.0 (KIP-848), PostgreSQL 15 (CREATE INDEX CONCURRENTLY, pg_stat_statements, lock_timeout), Spring Boot 3.x/Resilience4j, Java 17/21 (Generational ZGC flags, Math.floorMod), Hibernate 6
- Cơ chế đúng: isolation levels, deadlock, lost update, consumer lag math, partition pruning, expand/contract migration, cascading failure patterns
- Không có tiếng nước ngoài lẫn vào (chỉ thuật ngữ kỹ thuật tiếng Anh)
- Validate: q-scenario.js pass, không có lỗi
=> Không có lỗi kỹ thuật cần sửa
