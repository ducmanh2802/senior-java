# T2795R — Fact-check nội dung mới của T2795

Status: DONE
Agent: opencode
Owns: `js/data/quiz-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2795 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi kỹ thuật đã sửa trong `js/data/quiz-autotest.js` (câu mới của T2795, id 071–080):
- qz-autotest-071: `{{msg.type().equals("error")}}` → `{{msg.type() == ConsoleMessage.Type.ERROR}}` — `ConsoleMessage.type()` trả về `enum`, không thể so sánh với String.
- qz-autotest-073: bỏ cụm tiếng Anh "Actions shines" → "Actions tỏa sáng (phát huy)" (chữ nước ngoài lẫn vào văn tiếng Việt).
- qz-autotest-076: `java.util.List.of("geolocation")` → `java.util.Set.of("geolocation")` — `BrowserContext.grantPermissions` nhận `Set<String>`, không phải `List`.

Khác 10 câu mới không sai kiến thức (API Playwright/Selenium/RestAssured/Testcontainers đúng, markup không backtick/`${`, `multi` có "(Chọn 2)" và answer tăng dần, 4 options không trùng).

validate.js: không báo lỗi nào cho `quiz-autotest.js`. Không đạt "OK — không có lỗi" toàn cục vì `build-light-index.js` crash do lỗi cú pháp trước đó ở `labs-thread.js` (backtick trong template literal, file không thuộc task này, chưa sửa theo AGENTS.md §3) và validate còn báo lỗi cũ ở `quiz-ops.js`, `lessons-*`, `upwork-cases-*`… (các file không sở hữu, không được sửa).
