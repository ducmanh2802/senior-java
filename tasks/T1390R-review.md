# T1390R — Fact-check nội dung mới của T1390

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1390 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Đã chạy `node scripts/validate.js` → OK (không có lỗi)
- Nội dung mới từ T1390 là các section "Ví dụ đời thực" (real-world examples) được thêm vào 7 câu hỏi devops: devops-088, devops-089, devops-090, devops-091, devops-092, devops-093, devops-124
- Không phát hiện lỗi kỹ thuật (API/flag sai, cơ chế ngược, số liệu vô căn cứ), lỗi markup, hay chữ nước ngoài lẫn vào trong các ví dụ đời thực mới
- Các ví dụ dùng các công cụ/số liệu hợp lý: kubectl describe/node metrics, Prometheus metrics (container_cpu_cfs_throttled_periods_total, container_memory_working_set_bytes), NMT, jstack/jmap, cgroup v2 memory.max
- Schema đúng (id duy nhất, topic đúng, level đúng, không có field thừa)
