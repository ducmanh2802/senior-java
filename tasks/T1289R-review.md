# T1289R — Fact-check nội dung mới của T1289

Status: DONE
Agent: opencode
Owns: `js/data/q-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1289 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review 3 block mới của T1289 trong `js/data/q-autotest.js` (không thêm câu hỏi mới, chỉ bổ sung section `### Ví dụ đời thực` / `### Trả lời mẫu khi phỏng vấn` vào câu trả lời hiện có):
- autotest-038: Playwright `page.route` mock + component/API/E2E phân tầng — đúng kỹ thuật, markup `{{page.route}}` trùng code HEAD (js/data/q-autotest.js:2604).
- autotest-040: i18n/timezone/tiền, `BigDecimal`, `NumberFormat.getCurrencyInstance(locale)`, Playwright `locale/timezoneId` — đúng Java 17; số liệu story nhất quán với lời mẫu (40 API + 12 UI = 52 test vỡ).
- autotest-043: E2E vào monorepo, affected CI (Nx/Turborepo), contract test Pact — đúng khái niệm; số liệu nhất quán (45→8 phút).

Không tìm thấy lỗi kỹ thuật/markup trong file sở hữu. `node --check js/data/q-autotest.js` OK; `node scripts/validate.js` không báo lỗi thuộc `q-autotest.js`. Các LỖI còn lại của validate.js (`q-claude.js`, `lessons-testing.js`, `lessons-claude.js`, `projects.js`, `path.js`, cảnh báo `index-light.js`) nằm ngoài quyền sở hữu task này, không sửa (luật 3 AGENTS.md). Không git commit.
