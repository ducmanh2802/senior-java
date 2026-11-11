# T1311R — Fact-check nội dung mới của T1311

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1311 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ 6 phần "Ví dụ đời thực" mới thêm của T1311 trong js/data/q-devops.js (diff tại devops:~2370, 2452, 2553, 2657, 2755, 2852): (1) env ConfigMap/Secret không tự cập nhật + configtree + rollout restart + checksum annotation; (2) tag latest bất biến/digest/ECR immutability/OCI revision; (3) GitHub Actions OIDC + cache maven + concurrency group; (4) CronJob timeZone/Forbid/startingDeadlineSeconds/activeDeadlineSeconds/web-application-type=none; (5) PDB maxUnavailable + topologySpreadConstraints; (6) namespace/RBAC/ResourceQuota/LimitRange/NetworkPolicy/Pod Security restricted. Không tìm thấy lỗi kỹ thuật (API bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), không có lỗi markup (không backtick/${ trong template literal), không có chữ nước ngoài lẫn vào. node --check js/data/q-devops.js → SYNTAX OK; scripts/validate.js không báo lỗi nào cho q-devops.js. Các LỖI còn lại của validate.js (q-scenario.js, bugs.js, projects.js, path.js, index-light cũ) nằm ngoài file sở hữu, đã tồn tại trước, không do T1311 gây ra và không sửa được theo quy ước sở hữu file.
