# T2838 — Đề thi thử CKAD thực hành số 1 (16–17 bài, độ khó như đề thật) + tạo file và group

Status: TODO
Agent: kilo
Owns: `js/data/ckad-mock-1.js`, `js/data/ckad-mock-2.js`, `js/data/ckad-mock-3.js`, `js/data/ckad-labs-1.js`, `js/data/ckad-labs-2.js`, `js/data/ckad-labs-3.js`, `js/core/data-manifest.js`
After: T2834

Người học: dev Java backend 5 năm, thi **CKAD** (Certified Kubernetes Application Developer). Đề thật thi thực hành trên terminal, 2 giờ, 15–20 bài, đậu 66%, được mở docs kubernetes.io. Domain (CNCF): Application Design and Build 20%, Application Deployment 20%, Application Observability and Maintenance 15%, Application Environment, Configuration and Security 25%, Services and Networking 20%. Xem docs/CKAD-MOCK.md (12 module lab, môi trường kind `ckad`).

## Làm
1. Tạo `js/data/ckad-mock-1.js`: đề `ckad-1`, 16–17 bài, độ khó **ngang đề thật**, đủ 5 domain đúng trọng số. `intro` có kind config (~~~yaml, cluster `ckad`: 1 control-plane + 2 worker), lệnh tạo cluster, `mkdir -p /opt/ckad`, alias, cách chạy setup/verify, cài ingress-nginx/metrics-server/Calico khi cần.
2. Tạo file giữ chỗ: `ckad-mock-2.js`, `ckad-mock-3.js` (1 dòng comment + `window.CKAD_EXAMS = window.CKAD_EXAMS || [];`); `ckad-labs-1.js`, `ckad-labs-2.js`, `ckad-labs-3.js` (1 dòng comment + `window.CKAD_LABS = window.CKAD_LABS || [];`).
3. Trong `js/core/data-manifest.js` thêm group (1 dòng, cạnh group upwork): `ckad: ['ckad-mock-1.js', 'ckad-mock-2.js', 'ckad-mock-3.js', 'ckad-labs-1.js', 'ckad-labs-2.js', 'ckad-labs-3.js'],   // #/ckad đề thi thử + lab CKAD (docs/CKAD-MOCK.md)`. KHÔNG thêm route.

Gợi ý phủ bài: multi-container + emptyDir, init container, CronJob, Job parallel, build image + kind load, rollout + rollback về revision cụ thể, canary theo replica, Helm upgrade với values, Kustomize overlay, readiness probe sai, kubectl debug, ConfigMap volume, Secret env, SecurityContext, ServiceAccount + RoleBinding, ResourceQuota chặn pod, Service selector sai, Ingress path, NetworkPolicy.

## Luật
- Đề/lab **tự viết** đúng format và độ khó CKAD (đề thật bị NDA: không chép, không gọi là "đề thật").
- Đúng Kubernetes 1.30+: lệnh, field, flag có thật và chạy được (kubectl, helm 3, kustomize built-in, Ingress networking.k8s.io/v1, NetworkPolicy, native sidecar). Không chắc thì chọn nội dung khác. YAML trong ~~~yaml, lệnh trong ~~~bash.
- Mỗi bài: setup idempotent tạo đúng tình huống, verify kiểm **hành vi** và in PASS/FAIL + RESULT, solution có lệnh + VÌ SAO + mẹo tiết kiệm thời gian. Tự đọc lại: làm đúng solution thì verify PASS hết, chưa làm thì có FAIL.
- Tiếng Việt CÓ DẤU, giữ lệnh/thuật ngữ tiếng Anh. Không backtick, không `${` (bash dùng $VAR), dấu \ viết \\.
- Không trùng tình huống với các file ckad-mock-*/ckad-labs-* đã có (đọc trước).
- Chỉ sửa file bạn sở hữu.

## Nghiệm thu
`node --check js/data/ckad-mock-1.js`; `node scripts/check-ckad.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt, không chạy cluster thật.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id/số bài và phân bố domain.

## Notes

## Cập nhật 2026-11-28
Placeholder `ckad-mock-1..3.js`, `ckad-labs-1..3.js` và group `ckad` trong data-manifest ĐÃ có sẵn (view #/ckad đã chạy). Bỏ bước 2–3: chỉ điền nội dung vào `js/data/ckad-mock-1.js` (thay dòng placeholder), không sửa data-manifest.
