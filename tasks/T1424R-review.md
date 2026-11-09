# T1424R — Fact-check nội dung mới của T1424

Status: DONE
Agent: opencode
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1424 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-db-011 (WAL/crash recovery, lessons-db.js:2069): sửa lỗi kỹ thuật "{{COPY}} hoặc extension bỏ qua WAL" → "bảng unlogged hoặc extension bỏ qua WAL" (COPY ghi WAL cho bảng thường; chỉ bảng unlogged/extension mới bỏ qua WAL).
- q-remote.js:5977 (không thuộc task này, nhưng chặn build-light-index.js): sửa `${userId}` → `\${userId}` trong template literal (ReferenceError do T1424 đổi escape).
- Nội dung mới còn lại của T1424 trong lessons-db.js (keyset/offset pagination, WAL recovery, check questions, senior tip) đã review: đúng kỹ thuật, không lỗi markup, không cần sửa.
- node scripts/test-lessons.js: 219/219 pass. node scripts/validate.js: OK.
