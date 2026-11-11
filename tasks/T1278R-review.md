# T1278R — Fact-check nội dung mới của T1278

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1278 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 4 lỗi kỹ thuật trong 6 section "Ví dụ đời thực" mới (devops-014, devops-015, devops-017, devops-034):

1. **devops-015 (JVM/CFS throttling)**: Sửa giá trị mặc định JVM GC threads cho Pod 2 CPU. Sai: "ParallelGCThreads=8, ConcGCThreads=4". Đúng: ParallelGCThreads=2, ConcGCThreads=1 (mặc định JVM = số CPU). Cập nhật thread dump và cách xử lý tương ứng.

2. **devops-017 (Graceful shutdown/Kafka)**: Sửa câu sai "consumer idempotent key trùng → bị bỏ qua như duplicate → mất message". Idempotent consumer VỚI duplicate detection CHỐNG mất message (xử lý đúng khi redeliver), không gây mất message. Đã xóa cụm "nhưng consumer idempotent key trùng → bị bỏ qua như duplicate → mất message".

3. **devops-014 (Log4Shell/Supply chain)**: Sửa version check Log4Shell từ "< 2.17.1" thành "< 2.15.0". CVE-2021-44228 (Log4Shell) được fix ở 2.15.0; 2.17.1 là version fix CVE-2021-44832 (khác).

4. **devops-034 (Nginx/ALB)**: Sửa mô tả ALB retry. Sai: "retry sau 60 giây" và "cấu hình ALB không retry non-idempotent". Đúng: ALB retry mặc định trên lỗi 5xx/timeout theo retry policy; không có setting đơn giản "không retry non-idempotent". Đã sửa thành "ALB có retry mặc định trên lỗi 5xx/timeout" và "cấu hình ALB retry policy giới hạn max retries và tắt retry cho 504 nếu không an toàn".

Chạy validate + build-light-index: OK.
