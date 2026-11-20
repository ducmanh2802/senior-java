# T2526R — Fact-check nội dung mới của T2526

Status: DONE
Agent: opencode
Owns: `js/data/q-frontend.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2526 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- frontend-021: Sửa "instanceof" narrowing → chỉ dành cho class, không áp dụng cho interface. Đã sửa thành "Narrowing: typeof (primitive), discriminant property (interface), instanceof (class)".
- frontend-022: Sửa "Spring Boot: forward /** to index.html" (imprecise) thành cấu hình controller "@GetMapping('/**') return 'forward:/index.html'" hoặc "ViewControllerRegistry.addViewController('/**').setViewName('forward:/index.html')".
- frontend-022: Sửa "WebMvc" (vague) thành "cấu hình ResourceHandler qua WebMvcConfigurer".
- Các câu còn lại (frontend-023, frontend-024, frontend-025): không có lỗi kỹ thuật.
