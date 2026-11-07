# T1047R — Fact-check nội dung mới của T1047

Status: DONE
Agent: opencode
Owns: `js/data/lessons-core.js`, `js/data/lessons-modern.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1047 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review toàn bộ js/data/lessons-core.js và js/data/lessons-modern.js. Nội dung mới của T1047 trong hai file chỉ là thêm dấu tiếng Việt (git diff +30/+32 dòng, toàn bộ là comment và chuỗi lỗi trong mã tham chiếu), không đổi nội dung kỹ thuật → không có lỗi kỹ thuật, markup, hay ngoại ngữ nào cần sửa.
- node scripts/test-lessons.js cho 16 bài (lesson-core-001..009, lesson-modern-001..007): tất cả pass (RESULT n/n, starter không pass hết như yêu cầu).
- node scripts/validate.js lessons-core.js → OK; node scripts/validate.js lessons-modern.js → OK; js/data/index-light.js đã sinh lại qua node scripts/build-light-index.js và nằm ở bản mới nhất.
- validate.js toàn repo vẫn báo 3 lỗi ~~~seq trong js/data/q-banking.js (banking-005/010/014: tên actor có dấu trong bước nhưng không dấu trong dòng actors, parseSeq đếm 7–8 actor). File này do T1042 sở hữu, nằm ngoài quyền sửa của T1047 (luật 3 AGENTS.md) nên không chạm. Đề xuất T1042 đồng bộ tên actor giữa dòng actors và các bước.
