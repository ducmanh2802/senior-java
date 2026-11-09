# T1253R — Fact-check nội dung mới của T1253

Status: DONE
Agent: opencode
Owns: `js/data/q-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1253 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ file `js/data/q-autotest.js` (45 câu hỏi autotest-001 đến autotest-045). Nội dung MỚI của T1253 (theo `git diff HEAD`) gồm 4 đoạn `### Ví dụ đời thực` được thêm vào:
- autotest-002: ví dụ version mismatch Chrome/ChromeDriver trên CI, khắc phục bằng pin version + Selenium Manager + mirror driver nội bộ
- autotest-017: ví dụ flaky do dùng chung BrowserContext static khi chạy parallel Playwright, sửa bằng ThreadLocal<BrowserContext>
- autotest-019: ví dụ giảm suite 120→18 phút bằng cách chuyển test logic xuống API, chạy headless + parallel
- autotest-023: ví dụ kết hợp APIRequestContext + page.route mock để test UI+API, giảm 45→5 phút

Tất cả 4 ví dụ đều:
- Đúng kỹ thuật (Selenium 4.18+, Playwright Java, REST Assured, ChromeDriver versioning)
- Số liệu thực tế, không bịa đặt
- Markup chuẩn (không backtick, không `${`, escape đúng)
- Thuật ngữ tiếng Anh giữ nguyên (CDP, W3C WebDriver, ThreadLocal, storageState, actionability, trace viewer...)
- Có `> Senior tip:` kết thúc

Validator `node scripts/validate.js` trả về `OK — không có lỗi.` Không có lỗi kỹ thuật, markup, hay ngôn ngữ cần sửa.
