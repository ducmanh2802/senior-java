# T1426R — Fact-check nội dung mới của T1426

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1426 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review toàn bộ nội dung mới của T1426 trong js/data/lessons-devops.js (git diff HEAD, 4 hunch):
- lesson-devops-007 (RBAC authorizer): bổ sung "Cơ chế từng bước" (authn→401, khớp rule, mặc định từ chối→403, không có deny, least privilege), ví dụ YAML Role+RoleBinding cho ci-sa trong namespace staging, bảng đối tượng Role/ClusterRole/RoleBinding/ClusterRoleBinding, 3 lỗi production (403 subject sai, default deny mỗi resource/verb, cache authorization vài giây), senior tip, 3 liên hệ phỏng vấn; thêm 1 câu check: kubectl auth can-i --as=system:serviceaccount:staging:ci-sa create deployments -n staging → đáp án B (RoleBinding trong cùng namespace).
- lesson-devops-017 (PVC/StorageClass): bổ sung "Cơ chế từng bước" (PVC→PV bind, chọn PV nhỏ nhất đủ dùng, dynamic provisioning, reclaim), lưu ý chọn PV nhỏ nhất, ví dụ manifest StorageClass gp3 + PVC 10Gi RWO trên AWS, WaitForFirstConsumer + EBS zonal, bảng access mode (RWO/ROX/RWX; EBS không hỗ trợ RWX), 3 lỗi production (PVC lớn hơn mọi PV, volumeMode Filesystem/Block, "no storage class available" + annotation is-default-class), senior tip, 3 liên hệ phỏng vấn; thêm 1 câu check: không có PV sẵn nhưng có provisioner → dynamic provisioner tạo PV rồi bind → đáp án A.

Kết quả: KHÔNG có lỗi kỹ thuật, KHÔNG lỗi markup (~~~yaml đã đóng, bảng đúng, {{}} khớp, không backtick, không ${), KHÔNG lẫn ngôn ngữ ngoài (thuật ngữ giữ tiếng Anh theo quy ước). Không có lỗi kiến thức → không sửa gì thêm. Không sửa nội dung đã có ở HEAD; không thêm/xoá mục.

Xác thực:
- node --check js/data/lessons-devops.js → OK.
- node scripts/validate.js js/data/lessons-devops.js → không báo lỗi nào cho file này (lỗi "index-light.js đã cũ" và lỗi lessons-jpa.js/q-scenario.js/path.js là do working tree của các agent khác, không liên quan đến file này; build-light-index.js không chạy được do q-scenario.js lỗi cú pháp, và file đó không thuộc quyền sở hữu T1426R nên không được sửa).
- Bài tập: node scripts/test-lessons.js bị chặn bởi lỗi cú pháp lessons-jpa.js (file agent khác, không được sửa), nên chạy driver riêng yêu cầu chỉ lessons-devops.js: reference của 3 bài tập pass hết (8/8, 7/7, 6/6); starter compile được nhưng không pass hết test → đáp ứng gate bài học.

Tóm tắt Notes: không có lỗi.
