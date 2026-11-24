# T2674R — Fact-check nội dung mới của T2674

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2674 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed nội dung mới trong js/data/q-soft.js (behavioral-084, behavioral-085, behavioral-086 — level lead/senior/senior, topic behavioral):
- Không có lỗi kỹ thuật: các khái niệm nhắc đến (ADR, {{pg_stat_statements}}, p99, retry storm, canary 5% traffic, characterization/approval test, feature flag, @Transactional) đều đúng, không API/flag bịa, không số liệu vô căn cứ (con số là ví dụ minh họa trong câu trả lời hành vi, không khẳng định kỹ thuật cứng).
- Không lỗi markup: không có backtick hay ${ bên trong nội dung template literal; node --check qua, validate.js không báo lỗi nào thuộc q-soft.js / behavioral-084..086.
- Không thêm/xoá mục, không chỉnh văn phong hay độ dài (không có lỗi kiến thức cần sửa).
- index-light.js vẫn cũ do không tái sinh được: node scripts/build-light-index.js bị crash bởi lỗi cú pháp trước đó ở lessons-design.js:4269 (file không sở hữu bởi task này, quy tắc 3 AGENTS.md, không sửa). Cảnh báo staleness này tồn tại trước task và không gắn với nội dung q-soft.js mình review.
- Các LỖI còn lại của validate.js (lessons-design.js, lessons-jvm.js, lessons-testing.js, path.js, q-concurrency-jvm.js) nằm ngoài file sở hữu, không do task này gây ra, không sửa.
