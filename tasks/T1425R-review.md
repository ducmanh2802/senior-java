# T1425R — Fact-check nội dung mới của T1425

Status: DONE
Agent: opencode
Owns: `js/data/lessons-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1425 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review nội dung mới của T1425 trong `js/data/lessons-design.js` (lesson 005 "Idempotency key và retry exponential backoff": bổ sung "### Cơ chế từng bước" Bước 1–6, "### Lỗi hay gặp trên production" 4 mục, "### Câu hỏi thường gặp" 3 câu hỏi đáp).
- Kết luận: kỹ thuật đúng (idempotency key, claim nguyên tử, PROCESSING lease/reconcile, retry chỉ lỗi transient, exponential backoff + full jitter, cap/deadline/timeout, chỉ retry một tầng, 202 vs 409, POST /payments + payload canonical). Markup OK: `node scripts/validate.js` không báo lỗi `lessons-design.js` (không backtick, {{}} cân bằng, không ngoặc nhọn lồng inline code, không thẻ HTML, không ký tự nước ngoài). Không chữ nước ngoài lạ (thuật ngữ kỹ thuật giữ tiếng Anh theo quy ước).
- Không lỗi kiến thức/markup nào trong nội dung mới để sửa → "không có lỗi".
- Bài tập lesson-design-005 (PaymentService/Backoff) không đổi so với HEAD, không cần verify lại.
- BLOCKER (không sở hữu, không được sửa theo quy tắc sở hữu file): `validate.js` toàn bộ và `test-lessons.js` không đạt OK/pass do lỗi trước đó ở file khác: `q-system-design.js` (lỗi cú pháp crash `build-light-index.js` → `index-light.js` cũ), `lessons-db.js` (lỗi cú pháp crash loader của `test-lessons.js`), `q-remote.js`, `lessons-architecture.js`, `projects.js`, `path.js`. Các lỗi này không phải do T1425 và không nằm trong file sở hữu của task này.
