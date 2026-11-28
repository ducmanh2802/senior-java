# T2844 — Lab CKAD module 9–12 (ConfigMap/Secret, security, Service/Ingress, NetworkPolicy)

Status: DONE
Agent: claude
Owns: `js/data/ckad-labs-3.js`

Người học: dev Java backend 5 năm, thi **CKAD** (Certified Kubernetes Application Developer). Đề thật thi thực hành trên terminal, 2 giờ, 15–20 bài, đậu 66%, được mở docs kubernetes.io. Domain (CNCF): Application Design and Build 20%, Application Deployment 20%, Application Observability and Maintenance 15%, Application Environment, Configuration and Security 25%, Services and Networking 20%. Xem docs/CKAD-MOCK.md (12 module lab, môi trường kind `ckad`).

Điền `js/data/ckad-labs-3.js` (thay dòng giữ chỗ), 4 lab, mỗi lab 5–7 bài:
- Module 9 `ckad-lab-09`: ConfigMap và Secret (nội dung chi tiết ở docs/CKAD-MOCK.md)
- Module 10 `ckad-lab-10`: Resources và bảo mật (nội dung chi tiết ở docs/CKAD-MOCK.md)
- Module 11 `ckad-lab-11`: Services và Ingress (nội dung chi tiết ở docs/CKAD-MOCK.md)
- Module 12 `ckad-lab-12`: NetworkPolicy, PVC, CRD (nội dung chi tiết ở docs/CKAD-MOCK.md)

## Luật
- Đề/lab **tự viết** đúng format và độ khó CKAD (đề thật bị NDA: không chép, không gọi là "đề thật").
- Đúng Kubernetes 1.30+: lệnh, field, flag có thật và chạy được (kubectl, helm 3, kustomize built-in, Ingress networking.k8s.io/v1, NetworkPolicy, native sidecar). Không chắc thì chọn nội dung khác. YAML trong ~~~yaml, lệnh trong ~~~bash.
- Mỗi bài: setup idempotent tạo đúng tình huống, verify kiểm **hành vi** và in PASS/FAIL + RESULT, solution có lệnh + VÌ SAO + mẹo tiết kiệm thời gian. Tự đọc lại: làm đúng solution thì verify PASS hết, chưa làm thì có FAIL.
- Tiếng Việt CÓ DẤU, giữ lệnh/thuật ngữ tiếng Anh. Không backtick, không `${` (bash dùng $VAR), dấu \ viết \\.
- Không trùng tình huống với các file ckad-mock-*/ckad-labs-* đã có (đọc trước).
- Chỉ sửa file bạn sở hữu.

## Nghiệm thu
`node --check js/data/ckad-labs-3.js`; `node scripts/check-ckad.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt, không chạy cluster thật.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id/số bài và phân bố domain.

## Notes
- 4 module, 26 bài: ckad-lab-09 (6 bài: ConfigMap/Secret literal, file+subPath, env-file+prefix, cập nhật volume/env + immutable, sửa CreateContainerConfigError + Secret volume 0400), ckad-lab-10 (7 bài: requests/limits+QoS, LimitRange, ResourceQuota+event, SecurityContext, runAsNonRoot + image non-root, SA/Role/RoleBinding/automount, tổng hợp least privilege), ckad-lab-11 (6 bài: ClusterIP+DNS, sửa selector/targetPort, NodePort 30111, Ingress path, rewrite-target, tổng hợp Service+Ingress 2 host), ckad-lab-12 (7 bài: default deny, podSelector, namespaceSelector AND, egress+DNS, PVC local-path, CRD Backup, tổng hợp PVC+NetPol+CR).
- Domain: Environment, Config & Security 14 bài (module 9, 10, 12-06); Services & Networking 11 bài (module 11, 12-01..04, 12-07); Design & Build 1 bài (12-05 PVC).
- Video chỉ dùng ID trong scripts/videos-verified.js (Q9fHJLSyd7Q, FAnQTgr04mU, Krpb44XR0bk, 5creJtM4sIM, ZoTKkmY6VSw, T4Z7visMM4E, 80Ew_fsV4rM, eVtnevr3Rao, Fr-6oDHbobM); note không ghi mốc phút vì chưa kiểm chứng.
- Setup module 11 cài ingress-nginx bằng manifest của kind và gắn nhãn ingress-ready=true cho ckad-control-plane; verify gọi Service ingress-nginx-controller nội bộ kèm header Host từ Pod curl-client (curlimages/curl:8.10.1).
- Setup module 12 (NetworkPolicy) cài Calico v3.28.2 nếu cluster tạo với disableDefaultCNI; nếu còn kindnet thì in cảnh báo (concepts có kind config + lệnh tạo lại cluster). Bài 10-02/10-03 dùng namespace riêng lab10-quota để quota không ảnh hưởng bài khác; module 12 thêm lab12-monitor, lab12-ext.
- File được bọc IIFE để dùng chung snippet bash (SH, VH, INGRESS, NET12, CRD12…) mà không tạo biến global.


## Video hướng dẫn (bổ sung 2026-11-28)

Mỗi lab module phải có field `videos` (1–3 video). Đọc mục `videos` trong tài liệu schema. **Chỉ dùng ID trong `scripts/videos-verified.js`**; checker chặn ID ngoài danh sách. `note` nói rõ xem đoạn nào và vì sao.
