# T586 — 12 câu trắc nghiệm devops mới

Status: DONE
Reviewed-by: claude (self-checked: validate)
Agent: qoder
Owns: `js/data/quiz-ops.js`

Thêm 12 câu topic devops vào `js/data/quiz-ops.js` (đọc AGENTS.md mục 4 phần QUIZ; đọc câu devops sẵn có trong mọi file quiz-*.js để không trùng). Chủ đề: container memory & JVM flags, probes, QoS/eviction, DNS ndots, Terraform state/lock, SBOM/cosign, Linux fd/ports, SLO burn rate, rollout strategy, GitOps drift. 3 câu `multi: true` (Chọn 2). Đáp án đúng rải đều 0–3. `explain` nói vì sao đúng VÀ vì sao từng phương án sai. id tiếp nối số lớn nhất của qz-devops trên mọi file quiz.

## Nghiệm thu
`node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes.

## Notes
- Thêm 12 câu vào quiz-ops.js (ngay sau qz-devops-022): qz-devops-023 (JVM heap mặc định trong container), 024 (multi: liveness không phụ thuộc DB), 025 (thứ tự node-pressure eviction), 026 (ndots/search domain), 027 (multi: Terraform lock + CI apply), 028 (GitOps drift HPA vs replicas), 029 (cosign ký digest), 030 (multi: SBOM/scan), 031 (hết ephemeral port/TIME_WAIT), 032 (/proc/PID/limits vs ulimit/systemd), 033 (tính burn rate), 034 (rollout kẹt maxUnavailable 0).
- Đáp án single: 0×2, 1×2, 2×2, 3×3; multi: [1,3], [0,2], [2,4].
- validate OK.
