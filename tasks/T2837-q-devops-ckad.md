# T2837 — CKAD: 6 câu hỏi phỏng vấn K8s cho dev Java (topic devops)

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`

Thêm **6 câu hỏi** topic `devops` vào `js/data/q-devops.js` theo AGENTS.md mục 4 và 6, tag `'ckad'`. Đọc danh sách câu có sẵn (`node scripts/qtool.js list js/data/q-devops.js`) để không trùng; trùng thì chọn góc sâu hơn.

Người học: dev Java backend 5 năm, thi **CKAD** (Certified Kubernetes Application Developer). Đề thật thi thực hành trên terminal, 2 giờ, 15–20 bài, đậu 66%, được mở docs kubernetes.io. Domain (CNCF): Application Design and Build 20%, Application Deployment 20%, Application Observability and Maintenance 15%, Application Environment, Configuration and Security 25%, Services and Networking 20%. Xem docs/CKAD-MOCK.md (12 module lab, môi trường kind `ckad`).

Câu cần có:
1. Cấu hình liveness/readiness/startup probe cho Spring Boot (actuator health groups): lỗi hay gặp làm restart dây chuyền khi DB chậm. (senior)
2. ConfigMap/Secret cho Spring Boot: env vs volume, cập nhật không restart (volume mount tự cập nhật, env thì không, subPath không), bảo mật Secret (base64 không phải mã hoá, encryption at rest, external secrets). (senior)
3. Chạy batch Java trên K8s: Job vs CronJob, backoffLimit, activeDeadlineSeconds, concurrencyPolicy, idempotency khi job chạy lại. (senior)
4. Debug pod Java lỗi trên K8s: CrashLoopBackOff, OOMKilled (exit 137), logs --previous, kubectl debug ephemeral container, events. (mid)
5. Helm hay Kustomize để deploy nhiều môi trường: cơ chế, trade-off, kết hợp. (senior)
6. Canary/blue-green chỉ bằng Deployment + Service so với Argo Rollouts/service mesh: giới hạn, khi nào cần công cụ. (lead)

Mỗi câu: **Tóm tắt:** → cơ chế VÌ SAO → lệnh/YAML ngắn có comment → bảng trade-off → pitfall production → Ví dụ đời thực có số → Trả lời mẫu 150–220 từ → > Senior tip:; follow 2–3 câu.

## Luật
- Tiếng Việt CÓ DẤU. Không backtick, không `${`. Chỉ THÊM vào file của bạn, id nối tiếp.
- Đúng Kubernetes 1.30+: lệnh, field, flag có thật và chạy được (kubectl, helm 3, kustomize built-in, Ingress networking.k8s.io/v1, NetworkPolicy, native sidecar). Không chắc thì chọn nội dung khác. YAML trong ~~~yaml, lệnh trong ~~~bash.

## Nghiệm thu
`node --check js/data/q-devops.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt, không chạy cluster thật.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id/số bài và phân bố domain.

## Notes
- Đã thêm 6 câu vào `js/data/q-devops.js`, id nối tiếp **devops-216 … devops-221** (file hiện có 220 câu, id liên tục 001–221, chỉ còn gap 050 có từ trước, không thuộc task này). Tất cả tag `'ckad'` (lần đầu dùng tag này trong file).
- Phân bố theo domain CKAD (CNCF):
  - devops-216 (senior) — liveness/readiness/startup probe + health group Actuator, restart dây chuyền → **Observability & Maintenance** (15%).
  - devops-217 (senior) — ConfigMap/Secret, env vs volume, subPath, base64/encryption at rest/ESO → **Environment, Config & Security** (25%).
  - devops-218 (senior) — Job vs CronJob, completions/parallelism/backoffLimit/activeDeadlineSeconds/concurrencyPolicy/suspend, idempotency → **Design & Build** (20%).
  - devops-219 (mid) — debug CrashLoopBackOff/OOMKilled 137, logs --previous, kubectl debug ephemeral container, events → **Observability & Maintenance** (15%).
  - devops-220 (senior) — Helm vs Kustomize, lệnh/template cốt lõi, kết hợp → **Deployment** (20%).
  - devops-221 (lead) — blue-green/canary chỉ bằng Deployment+Service vs Argo Rollouts/service mesh → **Deployment** (20%).
  - (Services & Networking 20% không có câu riêng trong 6 câu này; các câu networking đã có sẵn ở file.)
- Mỗi câu đủ cấu trúc: **Tóm tắt:** → cơ chế VÌ SAO → lệnh/YAML ngắn có comment → bảng trade-off → pitfall production → Ví dụ đời thực có số → Trả lời mẫu 150–220 từ → > Senior tip:; follow 2–3 câu; có refs kubernetes.io/helm.sh.
- Nghiệm thu: `node --check js/data/q-devops.js` OK; `node scripts/build-light-index.js` ghi lại index-light.js (476.1 KB); `node scripts/validate.js` **không có lỗi nào thuộc q-devops.js** (các lỗi còn lại là của lessons-payments.js/lessons-devops.js — file task khác, không sửa theo luật 3).
- Không commit, không mở trình duyệt, không chạy cluster thật.
Reviewed-by: kilo (T2837R)
