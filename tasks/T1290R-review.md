# T1290R — Fact-check nội dung mới của T1290

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1290 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Sửa 5 đoạn thêm vào trong `js/data/q-java.js` (do model free viết). Sau khi review, không phát hiện lỗi kiến thức kỹ thuật, markup hay chữ nước ngoài lẫn vào. Nội dung đã có ở HEAD không bị thay đổi. `node scripts/validate.js` → OK.

Các id được review (đều thêm 4 đoạn: Ví dụ đời thực + Trả lời mẫu khi phỏng vấn, sau `> Senior tip:`):
- core-021 (overload vs override): đúng kỹ thuật, ví dụ đời thực về `equals(UserProfile)` thiếu `@Override` và `HashSet` không gọi override là chuẩn.
- core-022 (`==` vs `equals`, `Long ==` bug): đúng, ví dụ ID 10523 và cache -128..127 chuẩn.
- core-023 (try/finally, return, System.exit): đúng, ví dụ deadlock + try-with-resources và `getSuppressed()` chuẩn.
- core-024 (static/instance block, method overridable trong constructor): đúng, ví dụ `BaseEntity.init()` và NPE chuẩn.
- core-025 (stack vs heap, StackOverflowError): đúng, ví dụ recursion cây 2.000 cấp và `ArrayDeque` chuẩn.

Không có lỗi.
