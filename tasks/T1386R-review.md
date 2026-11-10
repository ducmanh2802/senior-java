# T1386R — Fact-check nội dung mới của T1386

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1386 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- modern-045 (sealed + pattern matching): không có lỗi kỹ thuật. Cú pháp Java 21 đúng, exhaustiveness giải thích chính xác, pitfall migrate đầy đủ, ví dụ đời thực có nguyên nhân gốc và cách xử lý hợp lý.
- modern-046 (Java 8→21 migration): không có lỗi kỹ thuật. Lộ trình LTS-by-LTS chuẩn, công cụ jdeps/jdeprscan đúng, strong encapsulation & javax→jakarta xử lý đúng, virtual thread kèm semaphore limit, metrics thực tế hợp lý.
- validate.js chạy OK cho q-java.js (lỗi hiển thị thuộc q-spring-data.js, không liên quan task này).
- Đã chạy build-light-index.js và validate.js lần 2 → OK.
