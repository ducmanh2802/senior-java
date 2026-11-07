# T616R — Fact-check nội dung mới của T616

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T616 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lesson-banking-003: sửa nhãn diagram `check(amount, now)` → `check(amount)` khớp API thực tế `check(long amount)`; căn lỗi dòng `if (dailyTotal + amount > dailyLimit)` trong reference code; bổ sung section `### Liên hệ phỏng vấn` cuối body (bắt buộc AGENTS.md §12); body dùng markup `{{code}}`, không backtick, không `${}`.
- lesson-banking-004: bổ sung section `### Liên hệ phỏng vấn` cuối body.
- Kiểm tra: `node scripts/test-lessons.js` lesson-banking-003 = 4/4 pass, lesson-banking-004 = 6/6 pass (starter vẫn biên dịch được và không pass hết). `node scripts/build-light-index.js` đã sinh lại index-light.js. `node scripts/validate.js lessons-banking.js` → OK — không có lỗi.
- Không sở hữu (không sửa, integrator xử lý): `lessons-ai.js` lỗi validate trước đó (lesson-ai-002/003/004 body < 2500, check < 2); `path.js` warning lesson-banking-003/004 chưa có trong PATH — đề xuất bổ sung 2 id này cho integrator.
