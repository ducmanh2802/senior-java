# T107 — Tình huống thực tế lấy cảm hứng từ kênh "Tips Javascript" (viết lại cho Java)

Status: TODO
Agent: opencode
Owns: `js/data/q-scenario.js`
After: T104

**Dùng tìm kiếm web.** Kênh YouTube/blog "Tips Javascript" (anonystick — tipsjavascript, anonystick.com) có nhiều video về tình huống backend thực tế (flash sale, oversell tồn kho, Redis, Kafka, idempotency, rate limit, cache, thanh toán, phỏng vấn system design…).
1. Lập danh sách **15–25 video/bài** về tình huống backend thực tế của kênh: tiêu đề, link, tình huống cốt lõi. Ghi vào `## Notes` của task này.
2. Đối chiếu với các câu `scenario-*` và `design-*` đã có (đọc mọi `q:` trong js/data/q-scenario.js và q-system-design.js). Chọn **8–10 tình huống CHƯA có** hoặc có góc nhìn mới.
3. Viết 8–10 câu mới `scenario-0xx` (tiếp nối số lớn nhất) trong `q-scenario.js`: **tự viết bằng lời của bạn, lời giải bằng Java 17/21 + Spring Boot 3** (không dịch/chép nội dung kênh). Chuẩn chất lượng AGENTS.md mục 4–6 (Tóm tắt, ###, code Java ngắn, bảng trade-off, pitfall production, Senior tip, follow 2–3).
4. Mỗi câu có `refs` (AGENTS.md mục 13) gồm **link video/bài gốc của kênh làm nguồn cảm hứng** (`type: 'video'` hoặc `'article'`, note: "Tình huống gốc (Node.js) — lời giải ở đây viết cho Java") + 1 tài liệu chính thức. Chỉ dùng link bạn đã thấy trong kết quả tìm kiếm.
5. `node scripts/validate.js q-scenario.js` → OK; chạy `node scripts/check-links.mjs q-scenario.js` nếu môi trường có mạng.

## Notes
