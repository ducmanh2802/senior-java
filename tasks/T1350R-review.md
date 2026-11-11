# T1350R — Fact-check nội dung mới của T1350

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1350 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review toàn bộ 6 đoạn thêm của T1350 trong `js/data/q-devops.js` (diff HEAD → các mục "### Ví dụ đời thực" + "### Trả lời mẫu khi phỏng vấn" cho 6 câu hỏi xung quanh connection pool, startup time, API backward-compat, Istio, K8s upgrade, cost optimization). Không phát hiện lỗi kỹ thuật (mặc định sai, API bịa, cơ chế ngược, số liệu vô căn cứ), không có lỗi markup (không backtick, `${`, `\` cần escape), không có chữ nước ngoài lẫn vào. Nội dung phù hợp chuẩn Java 17/21, Spring Boot 3.x, Kubernetes, PostgreSQL, Istio, AWS. Không cần sửa. validate.js OK cho file này (các lỗi còn lại là pre-existing trong lessons-*/path.js, không liên quan).
