# T2835 — CKAD (2/2): 40 câu tình huống module 7–12

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ckad-2.js`
After: T2834

Người học: dev Java backend 5 năm, thi **CKAD** (Certified Kubernetes Application Developer). Đề thật thi thực hành trên terminal, 2 giờ, 15–20 bài, đậu 66%, được mở docs kubernetes.io. Domain (CNCF): Application Design and Build 20%, Application Deployment 20%, Application Observability and Maintenance 15%, Application Environment, Configuration and Security 25%, Services and Networking 20%. Xem docs/CKAD-MOCK.md (12 module lab, môi trường kind `ckad`).

Điền `js/data/quiz-ckad-2.js` (chỉ THÊM vào trong `push(...)`), 40 câu bám module 7–12: Helm/Kustomize, probes, logs/debug, API deprecations, ConfigMap/Secret, requests/limits, ResourceQuota/LimitRange, SecurityContext, ServiceAccount, RBAC cơ bản, Service/Ingress, NetworkPolicy, PVC, CRD.

Mỗi câu theo AGENTS.md mục 4 (quiz): `topic: 'devops'`, `q` bắt đầu bằng đúng một tag domain CKAD: `[Design & Build]`, `[Deployment]`, `[Observability]`, `[Config & Security]`, `[App Networking]` (view #/exam bốc câu theo tag; KHÔNG dùng tag của đề CKA). Chia domain gần đúng trọng số. Khoảng 20% câu `multi: true` "(Chọn 2)". Câu tình huống thực hành: "lệnh/manifest nào làm đúng X", "pod không Ready vì sao", "YAML này sai ở đâu". `explain` giải thích vì sao đúng và vì sao **từng** phương án sai, kèm lệnh thật. Tiếng Việt có dấu, giữ lệnh/thuật ngữ tiếng Anh. Đáp án rải đều. Id `qz-ckad-NNN` từ 041, 40 câu.

## Luật
- Đọc AGENTS.md (mục 4, 5). Không backtick, không `${` (JSONPath {.items[*].metadata.name} được, nhưng không có $ đứng trước {).
- Đúng Kubernetes 1.30+: lệnh, field, flag có thật và chạy được (kubectl, helm 3, kustomize built-in, Ingress networking.k8s.io/v1, NetworkPolicy, native sidecar). Không chắc thì chọn nội dung khác. YAML trong ~~~yaml, lệnh trong ~~~bash.
- Không trùng ý với `js/data/quiz-ops.js`, `quiz-cka-1.js` và file quiz-ckad khác.

## Nghiệm thu
`node --check js/data/quiz-ckad-2.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt, không chạy cluster thật.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id/số bài và phân bố domain.

## Notes
- 40 câu `qz-ckad-041` → `qz-ckad-080`, chỉ THÊM trong push(...), không trùng quiz-ckad-1/ops.
- Phân bố domain (theo tag đầu câu): Design & Build 8 (041? không — xem dưới), Deployment 8, Observability 6, Config & Security 10, App Networking 8.
  Cụ thể: [Deployment] 041–048 (8); [Design & Build] 049–056 (8); [Observability] 057–062 (6); [Config & Security] 063–072 (10); [App Networking] 073–080 (8).
- 8 câu multi:true "(Chọn 2)": 044, 052, 055, 059, 064, 068, 074, 078. Đáp án rải đều 0/1/2/3.
- Bám module 7–12 (Helm/Kustomize, probes/logs/debug/API deprecations, ConfigMap/Secret, requests-limits/ResourceQuota/LimitRange/SecurityContext/ServiceAccount/RBAC, Service/Ingress, NetworkPolicy/PVC/CRD).
- Nghiệm thu: `node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → "OK — không có lỗi." Không commit, không mở trình duyệt, không chạy cluster.
Reviewed-by: kilo (T2835R)
