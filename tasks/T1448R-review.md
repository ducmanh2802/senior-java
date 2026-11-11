# T1448R — Fact-check nội dung mới của T1448

Status: DONE
Agent: opencode
Owns: `js/data/q-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1448 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `autotest-013`: sửa phần mới mô tả tracing — bỏ claim "filter route ... để không ghi token" không có trong Playwright Java tracing API; thay bằng hướng dẫn đúng mức (bật `setSnapshots/setScreenshots`, cân nhắc `setSources(false)`, dùng context/tài khoản test sạch để hạn chế dữ liệu nhạy).
- `autotest-014`: thay Docker image không rõ nguồn `mwheelers/playwright-java` bằng image chính thức `mcr.microsoft.com/playwright/java` trong ví dụ đời thực và trả lời mẫu mới.
- `autotest-015`: sửa lỗi chính tả tiếng Việt trong heading mới `### Trả lời mẫu khi phỏngấn` → `### Trả lời mẫu khi phỏng vấn`.
- `autotest-035`: sửa phần mới về bảo mật trace — bỏ claim filter route network body không thuộc tracing API, chỉnh cách diễn đạt `tracing.start` với `screenshots/snapshots`, và nêu biện pháp giảm rủi ro dữ liệu nhạy thực tế.
- `autotest-037`: sửa phần mới về trace/screenshot — bỏ claim "custom route filter bỏ qua ..." và "locator mask (che bằng ***)" như API tracing/screenshot cụ thể; thay bằng hướng dẫn an toàn thực tế (tài khoản/context sạch, hạn chế quyền truy cập artifact, che dữ liệu nhạy khi chụp nếu tool hỗ trợ).
- Đã chạy: `node --check js/data/q-autotest.js` (OK), `node scripts/validate.js` → `OK — không có lỗi.` (không sửa lesson nên không chạy `scripts/test-lessons.js`).
