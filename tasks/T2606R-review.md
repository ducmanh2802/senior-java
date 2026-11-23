# T2606R — Fact-check nội dung mới của T2606

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2606 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- microservices-126: sửa từ Anh lẫn vào văn ("stays" → "giữ lại trong backend service").
- microservices-127: sửa bảng so sánh — NetworkPolicy/Resilience4j không cung cấp mTLS built-in (NetworkPolicy chỉ lọc lưu lượng; mTLS phải tự triển khai).
- Chạy node scripts/build-light-index.js rồi node scripts/validate.js → OK — không có lỗi. Không thêm/xoá mục, không chỉnh văn phong ngoài các lỗi trên.