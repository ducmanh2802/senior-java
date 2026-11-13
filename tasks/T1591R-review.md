# T1591R — Fact-check nội dung mới của T1591

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-2.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1591 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check nội dung mới (qz-ccaf-046 → qz-ccaf-055) trong `js/data/quiz-cca-2.js`:

- `node scripts/validate.js` → OK — không có lỗi.
- `node scripts/build-light-index.js` → đã sinh lại `js/data/index-light.js` (claude: 42 câu hỏi, 471 trắc nghiệm).
- Không phát hiện lỗi kiến thức kỹ thuật, lỗi markup hay chữ nước ngoài lẫn vào trong 10 câu mới:
  - qz-ccaf-046 (allow/ask/deny permission design) — đúng, giải thích đủ 3 trạng thái.
  - qz-ccaf-047 (context giới hạn, lưu quy ước vào CLAUDE.md hoặc session mới) — đúng.
  - qz-ccaf-048 (hook fail closed) — đúng, phân biệt fail-closed với silently skip.
  - qz-ccaf-049 (đồng thời edit cùng file — ghi overwrite) — đúng, không có tự động merge.
  - qz-ccaf-050 (analysis effort theo complexity) — đúng.
  - qz-ccaf-051 (API key không để trong CLAUDE.md) — đúng, đề xuất env/secret manager.
  - qz-ccaf-052 (CI: isolated runner + narrow scoped token) — đúng, answer [1,2] phù hợp.
  - qz-ccaf-053 (audit transcript + redact secrets) — đúng, answer [0,2] phù hợp.
  - qz-ccaf-054 (CI credential: protected secret + rotate/scope) — đúng, answer [0,3] phù hợp.
  - qz-ccaf-055 (MCP: enable only needed tools, credentials ngoài Git) — đúng, answer [0,2] phù hợp.
- Không thay đổi nội dung đã có ở HEAD; chỉ thêm 10 câu vào cuối file.
