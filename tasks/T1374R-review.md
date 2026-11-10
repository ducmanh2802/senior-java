# T1374R — Fact-check nội dung mới của T1374

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1374 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- spring-034 (Flyway/schema lock): xóa block `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn` bị dán lặp hai lần (giữ 1 block, nội dung kỹ thuật Flyway đã đúng: transaction nên không dùng CONCURRENTLY, lock-retry-count, tách migration nặng ra khỏi boot).
- spring-036 (Jackson): xóa dòng `> Senior tip:` trùng với dòng tip đóng câu.
- spring-037 (Hibernate serialize + Jackson): xóa dòng `> Senior tip:` trùng với dòng tip đóng câu.
- spring-038 (schema drift): xóa dòng `> Senior tip:` trùng với dòng tip đóng câu.
- Không tìm thấy lỗi kiến thức kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ) và không có lỗi markup/chữ nước ngoài lẫn vào trong diff T1374. Mọi đáp án vẫn kết thúc bằng đúng một `> Senior tip:` theo AGENTS.md §6.
- `node --check js/data/q-spring-data.js`: OK. `node scripts/validate.js`: OK — không có lỗi. Không thêm/xoá mục, không sửa nội dung đã có ở HEAD ngoài 4 lỗi trên.