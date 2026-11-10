# T1306R — Fact-check nội dung mới của T1306

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1306 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- line 2426: `{{java.util.regex.Graph.match}}` → `{{java.util.regex.Matcher}}` — `java.util.regex.Graph` không tồn tại trong Java API; đúng là `Matcher` (hoặc `Pattern`).
- line 2789: Bổ sung `{{...}}` markup cho `-Xmx8G`, `jmap -histo`, `maximumSize(500000)`, `expireAfterAccess(30, TimeUnit.MINUTES)` — nhất quán với quy ước markup tại dòng 2340 (cùng file).
- node scripts/validate.js → OK — không có lỗi.
