# T2839 — Đề thi thử CKAD thực hành số 2 (khó hơn đề thật một chút)

Status: DONE
Agent: claude
Owns: `js/data/ckad-mock-2.js`

Người học: dev Java backend 5 năm, thi **CKAD** (Certified Kubernetes Application Developer). Đề thật thi thực hành trên terminal, 2 giờ, 15–20 bài, đậu 66%, được mở docs kubernetes.io. Domain (CNCF): Application Design and Build 20%, Application Deployment 20%, Application Observability and Maintenance 15%, Application Environment, Configuration and Security 25%, Services and Networking 20%. Xem docs/CKAD-MOCK.md (12 module lab, môi trường kind `ckad`).

Điền `js/data/ckad-mock-2.js` (thay dòng giữ chỗ bằng push 1 đề): đề `ckad-2`, 16–17 bài, khó hơn đề thật một chút: bài nhiều bước, lỗi chồng lỗi (ví dụ Service selector sai + NetworkPolicy chặn + readiness sai), ràng buộc thời gian chặt. Đọc ckad-mock-1.js để không trùng; thêm chủ đề đề 1 chưa có (native sidecar, adapter container, CronJob concurrencyPolicy, Deployment pause/resume, Kustomize configMapGenerator, API deprecation convert manifest, LimitRange default, fsGroup, imagePullSecret, Ingress host + rewrite, egress NetworkPolicy cho DNS, PVC).

## Luật
- Đề/lab **tự viết** đúng format và độ khó CKAD (đề thật bị NDA: không chép, không gọi là "đề thật").
- Đúng Kubernetes 1.30+: lệnh, field, flag có thật và chạy được (kubectl, helm 3, kustomize built-in, Ingress networking.k8s.io/v1, NetworkPolicy, native sidecar). Không chắc thì chọn nội dung khác. YAML trong ~~~yaml, lệnh trong ~~~bash.
- Mỗi bài: setup idempotent tạo đúng tình huống, verify kiểm **hành vi** và in PASS/FAIL + RESULT, solution có lệnh + VÌ SAO + mẹo tiết kiệm thời gian. Tự đọc lại: làm đúng solution thì verify PASS hết, chưa làm thì có FAIL.
- Tiếng Việt CÓ DẤU, giữ lệnh/thuật ngữ tiếng Anh. Không backtick, không `${` (bash dùng $VAR), dấu \ viết \\.
- Không trùng tình huống với các file ckad-mock-*/ckad-labs-* đã có (đọc trước).
- Chỉ sửa file bạn sở hữu.

## Nghiệm thu
`node --check js/data/ckad-mock-2.js`; `node scripts/check-ckad.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt, không chạy cluster thật.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id/số bài và phân bố domain.

## Notes
- Đề `ckad-2` trong `js/data/ckad-mock-2.js`: 17 bài (ckad-2-01..17), tổng weight 100, tổng thời gian gợi ý 119 phút, namespace đều có tiền tố `m2-`.
- Phân bố domain: Design & Build 22 (bài 1, 6, 11, 16), Deployment 19 (3, 8, 13), Observability & Maintenance 15 (5, 10, 15), Environment, Config & Security 24 (2, 7, 12, 17), Services & Networking 20 (4, 9, 14).
- Chủ đề: native sidecar cho Job, adapter, CronJob concurrencyPolicy/deadline/history, PVC StorageClass sai, pause/resume, Kustomize configMapGenerator, rollback theo revision + strategy, convert API đã gỡ, startupProbe + readiness sai, kubectl top, LimitRange + ResourceQuota, imagePullSecret qua ServiceAccount + RBAC, fsGroup/readOnlyRootFilesystem, Secret key sai + ConfigMap immutable, Ingress host + rewrite, egress NetworkPolicy cho DNS, debug Service lỗi chồng lỗi (selector + targetPort + readiness + default-deny).
- check-ckad.js: không lỗi nào thuộc ckad-2 (lỗi còn lại thuộc ckad-lab-05-01, ckad-lab-06-02 của task khác).
