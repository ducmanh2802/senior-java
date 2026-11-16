# T2280 — Rà soát chất lượng các câu trắc nghiệm (lượt 2) trong quiz-ops.js

Status: DONE
Agent: kilo

## Notes
Đã rà soát toàn bộ các câu trắc nghiệm trong `js/data/quiz-ops.js`. Nội dung kỹ thuật (K8s, Docker, AWS, Security) hiện tại chính xác, cập nhật với thực tế. Không cần sửa đổi nội dung.

3 câu đã kiểm tra kỹ:
- `qz-devops-009`: Giải thích ImagePullBackOff và phân biệt rõ với CrashLoopBackOff/FailedScheduling.
- `qz-devops-031`: Giải thích đúng vấn đề ephemeral port exhaustion do TIME_WAIT.
- `qz-aws-016`: Giải thích đúng cơ chế Lambda SnapStart và các lưu ý về tạo lại trạng thái sau restore.