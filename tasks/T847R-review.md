# T847R — Fact-check nội dung mới của T847

Status: DONE
Agent: opencode
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T847 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review xong lesson-db-010 (B+ tree) và lesson-db-011 (WAL recovery) — hai bài mới thêm bởi T847, diff so với HEAD.
- Kỹ thuật: đúng PostgreSQL 15 (B-tree/Lehman-Yao, trang 8 KB, fillfactor 90, fan-out, WAL segment 16 MB, checkpoint, synchronous_commit, redo commit / bỏ qua chưa commit). Không tìm thấy cơ chế nói ngược, API/flag bịa, mặc định sai hoặc số liệu vô căn cứ.
- Markup: fence ~~~ cân bằng, không backtick / `${` vỡ template literal, không ~~~seq lỗi. Văn bản bằng tiếng Việt, thuật ngữ kỹ thuật trong {{}} hoặc đã giải thích.
- Code: tham chiếu khớp đúng từng test case (traced thủ công). node scripts/test-lessons.js: lesson-db-010 6/6, lesson-db-011 6/6; toàn bộ bộ bài 199/199. node --check js/data/lessons-db.js OK.
- validate.js: exit 0, in ra OK — không có lỗi. Không sửa nội dung HEAD (db-001..db-009), không thêm/xoá mục, không có lỗi nào cần sửa.
