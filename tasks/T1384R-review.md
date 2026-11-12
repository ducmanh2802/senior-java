# T1384R — Fact-check nội dung mới của T1384

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1384 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- devops-082: sửa phần "Ví dụ đời thực" — bỏ chi tiết bịa/sai quy trình "CI build cert mới nhưng Jenkins không triển khai" và "renew qua certbot rồi copy file thủ công"; mô tả lại đúng thực tế (cert đã cấp nhưng bước deploy vào Nginx bị bỏ sót, xử lý bằng triển khai cert đúng path + reload, hậu quả nhấn tự động gia hạn/triển khai kèm hook reload).
- devops-083: sửa phần "Trả lời mẫu khi phỏng vấn" — chuẩn hoá header {{X-Forwarded-For/Proto/Host}} (trước ghi HOST) và thay "protokol" bằng "giao thức (protocol)".
- devops-086: sửa phần "Ví dụ đời thực" — bỏ nguyên nhân bịa "memory leak do log4j không rotate" (log rotation là vấn đề đĩa, không phải nguyên nhân giữ char[] trong heap); mô tả đúng hơn là memory leak do cấu trúc lưu log trong bộ nhớ giữ {{char[]}}/{{String}}, cách xử lý tách khôi phục dịch vụ (restart/heap) và sửa code bỏ tích lũy log trong bộ nhớ.
- devops-084, devops-085, devops-087: không phát hiện lỗi kỹ thuật trong phần nội dung mới thêm.
- Kiểm tra: `node --check js/data/q-devops.js` OK, `node scripts/validate.js` → OK.

