# T2840 — Đề thi thử CKAD thực hành số 3 (mức killer.sh)

Status: DONE
Agent: claude
Owns: `js/data/ckad-mock-3.js`

Người học: dev Java backend 5 năm, thi **CKAD** (Certified Kubernetes Application Developer). Đề thật thi thực hành trên terminal, 2 giờ, 15–20 bài, đậu 66%, được mở docs kubernetes.io. Domain (CNCF): Application Design and Build 20%, Application Deployment 20%, Application Observability and Maintenance 15%, Application Environment, Configuration and Security 25%, Services and Networking 20%. Xem docs/CKAD-MOCK.md (12 module lab, môi trường kind `ckad`).

Điền `js/data/ckad-mock-3.js` (thay dòng giữ chỗ): đề `ckad-3`, 17–18 bài, **mức khó kiểu killer.sh**: nhiều namespace, sửa YAML có sẵn trong file, xuất kết quả ra file đúng định dạng, debug ứng dụng hỏng nhiều lớp. Đọc 2 đề trước để không trùng.

## Luật
- Đề/lab **tự viết** đúng format và độ khó CKAD (đề thật bị NDA: không chép, không gọi là "đề thật").
- Đúng Kubernetes 1.30+: lệnh, field, flag có thật và chạy được (kubectl, helm 3, kustomize built-in, Ingress networking.k8s.io/v1, NetworkPolicy, native sidecar). Không chắc thì chọn nội dung khác. YAML trong ~~~yaml, lệnh trong ~~~bash.
- Mỗi bài: setup idempotent tạo đúng tình huống, verify kiểm **hành vi** và in PASS/FAIL + RESULT, solution có lệnh + VÌ SAO + mẹo tiết kiệm thời gian. Tự đọc lại: làm đúng solution thì verify PASS hết, chưa làm thì có FAIL.
- Tiếng Việt CÓ DẤU, giữ lệnh/thuật ngữ tiếng Anh. Không backtick, không `${` (bash dùng $VAR), dấu \ viết \\.
- Không trùng tình huống với các file ckad-mock-*/ckad-labs-* đã có (đọc trước).
- Chỉ sửa file bạn sở hữu.

## Nghiệm thu
`node --check js/data/ckad-mock-3.js`; `node scripts/check-ckad.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt, không chạy cluster thật.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id/số bài và phân bố domain.

## Notes
- claude: js/data/ckad-mock-3.js, đề ckad-3, 17 bài (ckad-3-01..17), tổng weight 100, tổng 119 phút, namespace m3-*, đáp án dưới /opt/ckad/.
- Domain: Design & Build 19 (bài 1, 6, 13), Deployment 20 (3, 7, 11, 17), Observability & Maintenance 17 (5, 10, 15), Environment, Config & Security 24 (4, 8, 12, 16), Services & Networking 20 (2, 9, 14).
- Kịch bản: Job completions/parallelism/deadline + gom log; Service sai selector (khớp nhầm pod mock) + targetPort; Helm tìm revision tốt/rollback/upgrade -f; RBAC tối thiểu + auth can-i ra file; OOMKilled đọc lastState; sửa YAML hỏng 3 lỗi; blue-green; Secret env-file + subPath; NetworkPolicy namespaceSelector AND podSelector; custom-columns/sort-by/jsonpath ra file; ProgressDeadlineExceeded + minReadySeconds; hardening securityContext; init container nc -z + Deployment replicas 0; Ingress fan-out 4 lỗi; logs --previous + kubectl debug --target; ResourceQuota chặn pod surge; Kustomize overlay.
- Đã đổi 3 bài trùng với đề 1/2 (startupProbe, canary, rollback về revision theo image) sang OOMKilled, blue-green, progress deadline. Còn giao nhau một phần về chủ đề (Service selector/targetPort với ckad-2-14, securityContext read-only với ckad-1-12/2-12) nhưng tình huống khác.
- check-ckad: không lỗi thuộc ckad-3 (lỗi {{ }} ở ckad-lab-05-01/06-02 lúc chạy giữa chừng là của file lab khác); validate.js OK.
Reviewed-by: verify-only (code/UI task)
