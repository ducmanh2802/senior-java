# T1329R — Fact-check nội dung mới của T1329

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1329 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa các lỗi tiếng Việt không dấu trong nội dung mới (banking-031, banking-032, banking-034):
- banking-031: Sequence diagram "Hold khi thanh toán the" -> "thẻ", các nhãn "quet the/yeu cau/chuyen yeu cau/kiem tra the/hold 2 trieu/chap thue/thanh cong/in hoa don" -> có dấu đầy đủ
- banking-032: Các tiêu đề/mục "Thu tu xu ly" -> "Thứ tự xử lý", văn bản trong các bước xử lý, Senior tip, Cụm từ -> thêm dấu tiếng Việt
- banking-034: Bảng so sánh tiêu đề "Tieu chi/Toc do/Thuc thoi/Do phuc tap/Chi phi/Ru ro" -> "Tiêu chí/Tốc độ/Thực thời/Độ phức tạp/Chi phí/Rủi ro", nội dung "chon kien truc hien dai/Batch cuoi ngay van qua nang/nghen vao buoi dem" -> có dấu, Senior tip, Cụm từ -> thêm dấu tiếng Việt
Kiến thức kỹ thuật đúng, không phát hiện lỗi API/flag/cơ chế/số liệu sai. Validate OK.
