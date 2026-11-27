# T2813R — Fact-check nội dung mới của T2813

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2813 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 2 lỗi kỹ thuật trong `js/data/q-concurrency-jvm.js`:
1. **jvm-066**: Sửa mô tả sai về tmpfs — "không reclaim được (không có swap)" → "không được reclaim như page cache; các trang tmpfs chỉ giải phóng khi bị swap ra (nếu hệ thống có swap) hoặc khi file bị xoá. Trên Kubernetes swap thường tắt..."
2. **jvm-080**: Sửa mô tả mơ hồ về MaxRAMPercentage default — "default 25% trước JDK 10, nay ~25-50% tuỳ" → "mặc định 25% cho container nhỏ, tỷ lệ tăng dần cho limit lớn nhờ ergonomic JDK 10+"
Validation `node scripts/validate.js` cho file này hiện chỉ còn cảnh báo độ dài đáp án (không phải lỗi kỹ thuật).
