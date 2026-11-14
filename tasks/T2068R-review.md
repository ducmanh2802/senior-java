# T2068R — Fact-check nội dung mới của T2068

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2068 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. 12 câu trắc nghiệm mới (qz-core-031 đến qz-core-042) đều đúng kỹ thuật theo Java 17/21:
- Integer cache (-128..127), autoboxing, == vs equals
- String Pool, new String, intern()
- Overload resolution: widening > boxing > varargs
- Khởi tạo lớp: static block cha→con, instance init + ctor cha→con
- finally return ghi đè try return
- Record equals/hashCode theo thành phần, switch expression yield
- Optional: get() ném NSEE, orElse eager vs orElseGet lazy, không dùng field/param, of(null) ném NPE, map/filter an toàn trên empty
- Integer==int unboxing, Integer==Integer tham chiếu ngoài cache
- null overload chọn kiểu cụ thể nhất (String > Object)
- String nối compile-time constant vs runtime, final hằng
- Switch expression -> không fall-through, trả giá trị
- Optional.ofNullable(null).orElse, empty().isPresent, filter, get() trên có giá trị, flatMap
