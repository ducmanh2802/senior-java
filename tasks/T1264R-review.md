# T1264R — Fact-check nội dung mới của T1264

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1264 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- scenario-035: không có lỗi mới (BigDecimal, HALF_UP/HALF_EVEN, invariant tổng phân bổ = tổng nguồn đúng).
- scenario-036: dịch 5 đoạn tiếng Anh bị lạc trong `### Cơ chế từng bước` (items 2–6) sang tiếng Việt; `(expired)` → `(hết hạn)`.
- scenario-037: sửa API bịa `acceptExp()` → `acceptExpiresAt()` và gán đúng thư viện (Auth0 java-jwt, không phải JJWT) cho ví dụ `JWT.require(...)`; dịch "Mention NTP sync..." sang tiếng Việt.
- scenario-039: dịch "Mention single source of truth..." sang tiếng Việt.
- scenario-040: "Measure bytes/day" → "Đo bytes/ngày"; dịch "Mention level per environment..." sang tiếng Việt.
- scenario-041: dịch "Mention thread dump + metrics..." sang tiếng Việt; sửa chính tả "phỏngấn" → "phỏng vấn" (4 heading `### Trả lời mẫu khi phỏng vấn` + 1 mục "**Trả lời phỏng án:**").
- `node --check js/data/q-scenario.js`: OK. `node scripts/validate.js`: không đạt OK do lỗi trước đó trong file KHÔNG sở hữu — `js/data/q-devops.js:1357` có backtick `` `log4j-core` `` trong template literal (nội dung HEAD do agent khác để lại; AGENTS.md mục 3: không sửa file ngoài task). Lỗi này gây cascading: câu hỏi devops không nạp được → path.js báo devops-* không tồn tại → index-light.js cũ. Cần integrator sửa q-devops.js:1357 rồi chạy `node scripts/build-light-index.js` + `node scripts/validate.js`.
