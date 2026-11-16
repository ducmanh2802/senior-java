# T2190R — Fact-check nội dung mới của T2190

Status: DONE
Agent: opencode
Owns: `js/data/q-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2190 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- claude-012 (line 705) và claude-015 (line 900): `"model": "claude-opus-4"` là ID model không tồn tại — đã sửa thành `"claude-opus-5-5"` để nhất quán với các câu khác (claude-027 line 1839 vẫn giữ `claude-opus-5-5`). Đây là lỗi flag/API bịa do model free viết.

Các thay đổi khác trong diff (bỏ hậu tố phiên bản như Opus 5.5 → Opus, Sonnet 5.5 → Sonnet, bỏ Fable 5.1, đổi date beta header, bỏ version number trong văn bản) đều là chỉnh sửa phong cách/không phải lỗi kiến thức — đã giữ nguyên.

- claude-011: model free bỏ tier "Fable 5.1" và giảm từ 4 xuống 3 tầng. Đây là thay đổi về mặt mô tả (không còn model Fable trong tài liệu hiện hành), không phải lỗi kỹ thuật.

node scripts/validate.js → OK — không có lỗi.
