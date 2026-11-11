# T1336R — Fact-check nội dung mới của T1336

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1336 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 2 lỗi kỹ thuật trong nội dung mới của T1336:

1. **spring-016** (CascadeType/FetchType): Sửa mô tả nguyên nhân gốc trong "Ví dụ đời thực" – câu gốc nói "ràng buộc khoá ngoại ở bảng nối không chặn kịp" gây hiểu lầm. Thực tế: FK trên bảng nối chỉ ngăn orphan trong bảng nối, không ngăn Hibernate xoá bản thân entity Course khi có CascadeType.REMOVE. Đã viết lại rõ: "FK trên bảng nối chỉ ngăn việc tạo dòng mồ côi (orphan) trong bảng nối, không ngăn việc xoá bản thân entity Course".

2. **db-013** (PostgreSQL index types): Sửa dung lượng BRIN index trong "Ví dụ đời thực" – câu gốc viết "giảm từ ~45 GB xuống còn vài trăm KB" không chính xác. Với 2 tỷ dòng, BRIN index (pages_per_range=128) chiếm khoảng vài MB, không phải vài trăm KB. Đã sửa thành "giảm từ ~45 GB xuống còn vài MB".

Cũng sửa lỗi markup: ký tự Trung "孤儿" đã bị lẫn vào spring-016, đã thay bằng "mồ côi (orphan)".

`node scripts/validate.js` báo OK cho q-spring-data.js (các lỗi khác là pre-existing ở file khác không thuộc task này).
