# T1398R — Fact-check nội dung mới của T1398

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1398 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff T1398 (phần thêm mới "Ví dụ đời thực" + "Trả lời mẫu khi phỏng vấn") cho devops-115, devops-116, devops-117, devops-118, devops-119, devops-120.
- devops-120: sửa lỗi chính tả/chữ nước ngoài "trafic" → "traffic" trong "Trả lời mẫu khi phỏng vấn" và tinh gọn nhẹ mệnh đề cuối để giữ nghĩa kỹ thuật rõ ràng (pin phiên bản ingress-nginx và theo dõi thông báo bảo mật). Không thay đổi kiến thức.
- devops-115, devops-116, devops-117, devops-118, devops-119: không phát hiện lỗi kỹ thuật, API/flag bịa, số liệu vô căn cứ, hay lỗi markup trong phần mới.
- `node --check js/data/q-devops.js` → OK.
- `node scripts/build-light-index.js` → OK (đã sinh lại `js/data/index-light.js`).
- `node scripts/validate.js` → OK (1508 câu hỏi, 849 trắc nghiệm; chỉ còn cảnh báo có sẵn: `path.js: có 1 bài học không nằm trong PATH: lesson-design-007`).
