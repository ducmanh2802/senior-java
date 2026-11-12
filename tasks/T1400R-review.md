# T1400R — Fact-check nội dung mới của T1400

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1400 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff HEAD vs `js/data/q-devops.js` (phần mới thêm "Ví dụ đời thực" + "Trả lời mẫu khi phỏng vấn" cho devops-121..devops-126). `node --check js/data/q-devops.js` và `node scripts/validate.js` → OK.
- `devops-121` (Helm chart cho Spring Boot): sửa mô tả nguyên nhân gốc sai kỹ thuật ("kubelet không tự quay về bản cũ") → "Helm không tự rollback về bản ổn định trước đó" khi chưa bật `--atomic --timeout`.
- `devops-125` (Namespace/ResourceQuota/LimitRange): chuẩn hoá tên namespace ví dụ trong lệnh điều tra `team-the-dev` → `team-card-dev` để khớp ngữ cảnh/tình huống.
- `devops-126` (Tiêu chuẩn triển khai K8s): thay "K8s" → "Kubernetes" trong tình huống cho rõ ràng (thuật ngữ lần đầu trong đoạn thêm).
- `devops-122`, `devops-123`, `devops-124`: kiểm tra không thấy lỗi kỹ thuật/markup/API bịa trong phần mới; giữ nguyên.
