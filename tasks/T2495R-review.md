# T2495R — Fact-check nội dung mới của T2495

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2495 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Tất cả 10 câu trắc nghiệm mới (qz-design-081 → qz-design-090) đã được fact-check và giữ nguyên — không có lỗi kiến thức, markup hay chính tả.

Kiểm tra quiz.js của task này:
- `node --check js/data/quiz.js` → OK
- `node scripts/validate.js` với chỉ quiz.js → không có lỗi liên quan đến design-081..090

**Blocker không thể tự giải quyết (không phải quyền sở hữu của T2495R):**
`js/data/q-scenario.js` dòng 10203–10205 thiếu `(window.QUESTIONS = window.QUESTIONS || []).push(` wrapper — object `{ id: 'scenario-170', ... }` nằm ngoài mảng, làm:
- `node --check js/data/q-scenario.js` → SyntaxError: Unexpected token ':'
- `node scripts/build-light-index.js` → fail (không thể sinh index-light.js)
- `node scripts/validate.js` → exit 1 (Lỗi: q-scenario.js: lỗi cú pháp/chạy)

Đề xuất: agent sở hữu q-scenario.js (task T2489) thêm `(window.QUESTIONS = window.QUESTIONS || []).push(` trước `{ id: 'scenario-170',` và đóng `}` + `);` sau phần cuối cùng. Sau khi sửa xong, chạy `node scripts/build-light-index.js` để sinh lại index-light.js, rồi `node scripts/validate.js` sẽ OK.
