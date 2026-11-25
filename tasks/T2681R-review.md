# T2681R — Fact-check nội dung mới của T2681

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2681 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed T2681's new content: english-247 (lead, cross-team incident), english-248 (senior, eventual consistency to PM), english-249 (senior, migration estimation), english-250 (lead, security/compliance pushback).

Lỗi đã sửa: không có lỗi kiến thức. Tất cả 4 câu hợp lệ:
- Kỹ thuật chính xác, không bịa API/flag (PCI-DSS, AWS KMS, HashiCorp Vault, PostgreSQL/Redis replication lag, SELECT FOR UPDATE, canary, feature flag, MTTR đều dùng đúng).
- Markup hợp lệ: `**`, `###`, `-`, `1.`, `>`; không có backtick, không `${`, không `~~~`; `q` 1–2 câu, `follow` 3 câu mỗi câu, `lang: 'en'` đúng với topic `english`.
- Các phần tiếng Việt ("Useful phrases", "Lỗi người Việt hay mắc") là thiết kế của topic english, không phải chữ nước ngoài lẫn vào.

`node --check js/data/q-english.js` → OK. `node scripts/validate.js` → không báo lỗi nào về `q-english.js`.

Không thể chạy `node scripts/build-light-index.js`: script crash ở lỗi cú pháp trước đó của `q-devops.js:17701` (backtick trong template literal) — file không thuộc task này, quy tắc 3 AGENTS.md nên không touche. Các LỖI còn lại của validate (q-devops.js, lessons-*.js, path.js, projects.js) đều nằm trong file không sở hữu, không được sửa.
