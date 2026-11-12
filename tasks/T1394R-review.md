# T1394R — Fact-check nội dung mới của T1394

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1394 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review nội dung mới T1394 trong js/data/q-devops.js (phần bổ sung Ví dụ đời thực / Cơ chế chi tiết / Trả lời mẫu của devops-093 HPA Kafka, devops-095 HPA+CA+PDB, câu GitLab CI cache-key+needs DAG, devops-098 Jenkins K8s plugin+shared library, devops-099 SonarQube leak period/quality gate, devops-100 Docker layered jar+Trivy):
- Kỹ thuật: đúng (công thức HPA, stabilization 300s, custom metric path, PDB maxUnavailable phần trăm, CA flags, GitLab CI cache policy/DAG/needs, Jenkins @Library versi + Pipeline Unit, SonarQube leak period modes + metric new code, multi-stage/layered jar jarmode=tools, Trivy --ignore-unfixed/--scanners secret). Không có API/flag bịa, cơ chế nói ngược, số liệu vô căn cứ (số liệu chỉ là ví dụ mô tả).
- Markup: hợp lệ (không backtick trong template literal, mọi \${ đã escape, code-block lang hợp lệ, bảng đúng chuẩn).
- Ngôn ngữ: tiếng Việt, thuật ngữ kỹ thuật giữ tiếng Anh, không chữ nước ngoài lẫn sai.
- Không chỉnh văn phong/dộ dài/bố cục, không thêm/xoá mục, không sửa nội dung HEAD.
Không lỗi cần sửa. Chạy node scripts/build-light-index.js rồi node scripts/validate.js → OK — không có lỗi.
