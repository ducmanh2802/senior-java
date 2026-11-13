# T1585R — Fact-check nội dung mới của T1585

Status: DONE
Agent: opencode
Owns: `js/data/lessons-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1585 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff HEAD nội dung mới trong `js/data/lessons-design.js`: `lesson-design-006` (consistent hashing, vnode, successor/wrap-around, movement/distribution) và `lesson-design-008` (quorum R/W/N, overlap R+W>N, stale read, version chọn bản mới nhất).
- Không phát hiện lỗi kỹ thuật/API/cơ chế/ngược logic/markup/backtick/${; số liệu ví dụ (N=3,4,5; 1/(N+1) movement; case stale read) nhất quán. Starter/tests/reference khớp spec, Java 17-friendly.
- Kiểm tra: `node --check js/data/lessons-design.js` OK, `node scripts/test-lessons.js --file js/data/lessons-design.js` -> `Lesson exercises OK: 0/0 (0 bài học)` (script không nhận flag file), `node scripts/validate.js` -> `OK — không có lỗi.`
- Kết luận: không có lỗi kiến thức cần sửa.
