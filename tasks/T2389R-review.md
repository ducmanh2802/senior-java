# T2389R — Fact-check nội dung mới của T2389

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2389 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- qz-aws-036 (aws, multi): có 3 phát biểu đúng (0,1,2) nhưng q ghi "(Chọn 2)" và answer [0,1] → đã sửa thành "(Chọn 3)" và answer [0,1,2]; xóa dòng giải thích "sai" tự mâu thuẫn (tùy chọn 2 "Multi-AZ sync / Read Replica async" là đúng).
- Quiz mới khác (qz-aws-030…054 trừ 036): đã duyệt kỹ, không tìm thấy lỗi kỹ thuật/markup (không backtick, không `${`, id/topic/level/format đúng schema).
- quiz-ops.js: `node --check` OK; `node scripts/validate.js js/data/quiz-ops.js` không báo lỗi schema/markup cho file này.
- validate **full** chưa in OK do 3 lỗi nằm ngoài phạm vi task (không sửa theo quy tắc 3 AGENTS.md): `lessons-claude.js` lỗi cú pháp (làm crash `build-light-index.js`, nên không sinh lại được `index-light.js`), `path.js` tham chiếu lesson-claude-* đã bỏ, `index-light.js` đã cũ. Cần task sở hữu `lessons-claude.js` sửa xong rồi chạy `node scripts/build-light-index.js`.
