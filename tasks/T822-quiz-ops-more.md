# T822 — 15 câu trắc nghiệm DevOps/AWS mới

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ops.js`

Đọc AGENTS.md mục 4 (schema quiz) và HẾT câu hiện có trong `js/data/quiz-ops.js` để không trùng. id tiếp nối số lớn nhất của từng topic. Khoảng 1/3 là câu nhiều đáp án (`multi: true`, "(Chọn 2)"). Đáp án đúng rải đều vị trí. `explain` giải thích vì sao đúng và vì sao từng phương án sai. Thêm 15 câu: 8 topic devops (K8s workload/Service/probe, Linux permission, bash set -euo pipefail, Ansible vs Terraform, deploy strategy, Prometheus metric type), 7 topic aws (Route 53 record, SG vs NACL, S3 replication, VPN vs Direct Connect, Transit Gateway, EFS, SQS visibility).

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4 (phần trắc nghiệm) và 5. **Chỉ THÊM** vào cuối mảng trong `js/data/quiz-ops.js`; id `qz-<topic>-NNN` tiếp nối số lớn nhất hiện có của topic **trên mọi file quiz** (grep "qz-<topic>-" js/data/quiz*.js).
- Đọc các câu cùng topic đã có để không trùng. Câu hỏi theo tình huống thực tế (đoạn code, log, cấu hình), không hỏi định nghĩa suông.
- Khoảng 1/4 là `multi: true` (Chọn 2/Chọn 3). Đáp án đúng rải đều vị trí 0–3. Phương án sai phải hợp lý (lỗi hiểu nhầm hay gặp).
- `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai, 400–1200 ký tự.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node --check js/data/quiz-ops.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + số câu mới vào Notes.

## Notes
- Trước khi sửa: `js/data/quiz-ops.js` có 80 mục (`grep -c "id: '"`), 50 devops + 21 aws (trong file; `qz-aws-023` chưa có trong quiz-ops, `qz-devops` max 050).
- Đã **chỉ THÊM** 15 câu ngay trước `);` cuối file (không xoá/sửa object cũ): `qz-devops-051`–`qz-devops-058` (8 câu: K8s Job workload, Pod init/sidecar+probe, Linux permission `-rw-r-----`, bash `set -euo pipefail`, Ansible vs Terraform, canary deploy, Prometheus Counter/Gauge/Histogram, Service selector/endpoints) và `qz-aws-023`–`qz-aws-029` (7 câu: Route 53 Alias cho ALB, SG stateful + SG-to-SG vs NACL, S3 Replication + Versioning, VPN vs Direct Connect, Transit Gateway hub-and-spoke, EFS NFS chia sẻ đa AZ, SQS Visibility Timeout/ChangeMessageVisibility).
- Multi (`(Chọn 2)`): 6/15 (`qz-devops-052,055,057`, `qz-aws-024,026,029`) ≈ 40% (>1/3 theo yêu cầu task; >1/4 theo quy tắc chung). Đáp án đúng rải vị trí 0–3. `explain` giải thích vì sao đúng và từng phương án sai, kèm thuật ngữ giải thích cho người mới.
- Sau khi sửa: 95 mục (`80 + 15`). Kiểm tra: `node --check js/data/quiz-ops.js` OK; `node scripts/build-light-index.js` OK (quiz tổng 784); `node scripts/validate.js` → **OK — không có lỗi** (chỉ cảnh báo ngắn có sẵn ở file khác). Không git commit, không mở trình duyệt, không kill process theo tên.
Reviewed-by: kilo (T822R)
