# T2843 — Lab CKAD module 5–8 (Deployment, canary, Helm/Kustomize, probes/debug)

Status: TODO
Agent: kilo
Owns: `js/data/ckad-labs-2.js`
After: T2838

Người học: dev Java backend 5 năm, thi **CKAD** (Certified Kubernetes Application Developer). Đề thật thi thực hành trên terminal, 2 giờ, 15–20 bài, đậu 66%, được mở docs kubernetes.io. Domain (CNCF): Application Design and Build 20%, Application Deployment 20%, Application Observability and Maintenance 15%, Application Environment, Configuration and Security 25%, Services and Networking 20%. Xem docs/CKAD-MOCK.md (12 module lab, môi trường kind `ckad`).

Điền `js/data/ckad-labs-2.js` (thay dòng giữ chỗ), 4 lab, mỗi lab 5–7 bài:
- Module 5 `ckad-lab-05`: Deployment và rollout (nội dung chi tiết ở docs/CKAD-MOCK.md)
- Module 6 `ckad-lab-06`: Blue-green và canary (nội dung chi tiết ở docs/CKAD-MOCK.md)
- Module 7 `ckad-lab-07`: Helm và Kustomize (nội dung chi tiết ở docs/CKAD-MOCK.md)
- Module 8 `ckad-lab-08`: Probes và observability (nội dung chi tiết ở docs/CKAD-MOCK.md)

## Luật
- Đề/lab **tự viết** đúng format và độ khó CKAD (đề thật bị NDA: không chép, không gọi là "đề thật").
- Đúng Kubernetes 1.30+: lệnh, field, flag có thật và chạy được (kubectl, helm 3, kustomize built-in, Ingress networking.k8s.io/v1, NetworkPolicy, native sidecar). Không chắc thì chọn nội dung khác. YAML trong ~~~yaml, lệnh trong ~~~bash.
- Mỗi bài: setup idempotent tạo đúng tình huống, verify kiểm **hành vi** và in PASS/FAIL + RESULT, solution có lệnh + VÌ SAO + mẹo tiết kiệm thời gian. Tự đọc lại: làm đúng solution thì verify PASS hết, chưa làm thì có FAIL.
- Tiếng Việt CÓ DẤU, giữ lệnh/thuật ngữ tiếng Anh. Không backtick, không `${` (bash dùng $VAR), dấu \ viết \\.
- Không trùng tình huống với các file ckad-mock-*/ckad-labs-* đã có (đọc trước).
- Chỉ sửa file bạn sở hữu.

## Nghiệm thu
`node --check js/data/ckad-labs-2.js`; `node scripts/check-ckad.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt, không chạy cluster thật.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id/số bài và phân bố domain.

## Notes


## Video hướng dẫn (bổ sung 2026-11-28)

Mỗi lab module phải có field `videos` (1–3 video). Đọc mục `videos` trong tài liệu schema. **Chỉ dùng ID trong `scripts/videos-verified.js`**; checker chặn ID ngoài danh sách. `note` nói rõ xem đoạn nào và vì sao.
