# T2065R — Fact-check nội dung mới của T2065

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2065 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (theo id câu hỏi mới trong js/data/q-java.js):
- core-058: bỏ sai ý "String.equals dùng Arrays.equals/SIMD" (OpenJDK dùng vòng lặp byte, JIT tối ưu); bỏ sai ý "equalsIgnoreCase tạo chuỗi tạm upper/lower" (so sánh từng ký tự theo unicode).
- core-059: sửa sai khi khẳng định StringBuilder/StringBuffer không dùng Compact Strings — AbstractStringBuilder dùng byte[] + coder từ Java 9.
- core-060: xóa số liệu bịa ("chậm 50-100x" String.format, "2.5s→0.3s" CSV, "5.000 TPS/300 MB/s" log) thành mô tả chất lượng không con số.
- core-061: sửa ví dụ bộ nhớ — "Xin chào" là coder=0 (8 byte, 'à' = U+00E0 ≤ U+00FF), chỉ emoji mới coder=1.
- core-063: xóa bảng benchmark ns/op bịa và số ms (2ms/8ms/5ms) trong ví dụ SQL IN.
- core-062: sửa code `Files.writeString(..., StandardCharsets.UTF_8, ...)` không tồn tại (writeString luôn UTF-8, không có overload Charset).

node scripts/validate.js → OK.