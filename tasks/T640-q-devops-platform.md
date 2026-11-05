# T640 — 8 câu DevOps / platform engineering

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`

Topic **devops** có khoảng 48 câu (đọc hết để không trùng). Thêm 8 câu devops-0NN tiếp theo, level 2 mid / 4 senior / 2 lead, chủ đề chưa có, gợi ý:
- Terraform state: remote state + lock, drift detection, import tài nguyên tạo tay, tách state theo môi trường.
- HPA tuning cho service Java: metric CPU vs custom (RPS, lag Kafka), stabilization window, JVM warm-up làm HPA scale sai.
- Progressive delivery với Argo Rollouts: canary + analysis template dựa trên Prometheus.
- OpenTelemetry Collector: pipeline receivers/processors/exporters, tail sampling, chi phí.
- Secret trong GitOps: Sealed Secrets / External Secrets Operator.
- Quản lý chi phí Kubernetes: requests quá cao, bin packing, spot instance cho workload nào.
- Lead: xây dựng internal developer platform (golden path, template service) cho 20 team.
- Lead: chính sách on-call bền vững (rota, alert fatigue, SLO-based alerting).

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-devops.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-devops.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
- Thêm 8 câu: `devops-049` (mid, Terraform state mv/moved/import/remote_state refactor), `devops-050` (mid, KEDA Kafka consumer lag scaling, ScaledObject, scale-to-zero, JVM warm-up/rebalance), `devops-051` (senior, OpenTelemetry Collector pipeline receivers/processors/exporters, tail sampling, cost control), `devops-052` (senior, GitOps secrets: Sealed Secrets vs SOPS vs External Secrets Operator, rotation), `devops-053` (senior, HPA tuning cho Java: stabilization window, custom metrics RPS/p99, JVM warm-up/cold start, scaleUp/scaleDown behavior), `devops-054` (senior, Argo Rollouts canary + AnalysisTemplate Prometheus, baseline comparison, false positive/negative), `devops-055` (lead, Internal Developer Platform + golden path cho 20 team, adoption/co-design/metrics), `devops-056` (lead, on-call bền vững: rota, alert fatigue audit, SLO-based alerting/burn rate/error budget).
- Trước khi thêm: 48 câu `id: 'devops-'` trong `js/data/q-devops.js`. Sau khi thêm: 56 câu (48 + 8). Verify: `grep -c "id: 'devops-" js/data/q-devops.js` → 56.
- `node --check js/data/q-devops.js` OK. `node scripts/build-light-index.js` OK. `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo path.js không liên quan).
- Sửa 2 lỗi markup validator (nested braces trong `{{}}`): thay `{{/orders/{id}}}` bằng mô tả text + `{{/orders/:id}}`, thay `{{pause: {}}}` bằng `bước {{pause}} không có duration`.
- Không sửa file ngoài phạm vi task; không commit.
Reviewed-by: kilo (T640R)
