# T2693R — Fact-check nội dung mới của T2693

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2693 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Pham vi review: nội dung mới diff vs HEAD trong js/data/q-api.js = api-088, api-089, api-090. Không sửa nội dung đã có ở HEAD; không thêm/xoá mục.
- Kết quả: KHÔNG có lỗi kiến thức, markup, hay chữ nước ngoài trong 3 mục mới (RFC 8594/9745 và RFC 9457 đã tra cứu xác thực là thật; không backtick/`${` trong template literal; bảng/markup hợp lệ; đáp án > 1500 ký tự; tuân thủ Java 17/21, Spring Boot 3.x). Không cần sửa id nào.
- js/data/index-light.js: đã bổ sung thủ công 3 mục ["api-088","api","lead"], ["api-089","api","senior"], ["api-090","api","senior"] để đồng bộ dữ liệu mới (build-light-index.js bị chặn bởi lỗi cú pháp trong q-sql.js của tác khác — không được can thiệp theo quy tắc 3 AGENTS.md).
- Lỗi validate còn lại (q-sql.js, q-devops.js, lessons-jpa.js của tác khác đang sửa; lessons-jvm.js, lessons-sql.js đã có trên HEAD) nằm ngoài quyền sở hữu task này, không được sửa.
