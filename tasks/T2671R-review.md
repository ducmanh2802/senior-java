# T2671R — Fact-check nội dung mới của T2671

Status: DONE
Agent: opencode
Owns: `js/data/labs-gc.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2671 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lab-gc-028: Sửa format GC log sai `Pause Young (Normal) (G1 Humongous Allocation)` → `Pause Young (G1 Humongous Allocation)` (JDK chỉ cho 1 cause trong ngoặc). Sửa allocation rate JFR vô căn cứ 1.8 GB/s → ~830 MB/s (tính đúng: large 8.2+3.8, medium 2.6+1.5, small 0.36+0.1 MB/request × 50 req/s). Sửa line number JFR stack trace (45→35, 62→52) khớp code artifact.
- lab-gc-029: Sửa jcmd GC.class_stats output số liệu giả (5 cột identical 1247) thành giá trị thực tế (index, super, instances, bytes, objects). Xoá từ tiếng Hàn "쌓여" (tích lũy) trong comment thread dump.
- `node scripts/validate.js` OK cho labs-gc.js. `node --check js/data/labs-gc.js` OK.
