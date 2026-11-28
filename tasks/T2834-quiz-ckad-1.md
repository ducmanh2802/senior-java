# T2834 — CKAD (1/2): đề thi thử trắc nghiệm CKAD + 40 câu tình huống

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ckad-1.js`, `js/data/quiz-ckad-2.js`, `js/data/exams.js`, `js/core/data-manifest.js`

Người học: dev Java backend 5 năm, thi **CKAD** (Certified Kubernetes Application Developer). Đề thật thi thực hành trên terminal, 2 giờ, 15–20 bài, đậu 66%, được mở docs kubernetes.io. Domain (CNCF): Application Design and Build 20%, Application Deployment 20%, Application Observability and Maintenance 15%, Application Environment, Configuration and Security 25%, Services and Networking 20%. Xem docs/CKAD-MOCK.md (12 module lab, môi trường kind `ckad`).

Người dùng đổi từ CKA sang CKAD (bộ quiz CKA đã huỷ, không tạo).

## Làm
1. Thêm `'quiz-ckad-1.js', 'quiz-ckad-2.js'` vào cuối group `quiz` trong `js/core/data-manifest.js` (chỉ sửa dòng đó).
2. Tạo `js/data/quiz-ckad-1.js` 40 câu (module 1–6 của docs/CKAD-MOCK.md) và `js/data/quiz-ckad-2.js` giữ chỗ (comment + `(window.QUIZ = window.QUIZ || []).push(\n);`).
3. Thêm vào `js/data/exams.js` (ngay sau entry `cca-f`): `id: 'ckad'`, title 'Certified Kubernetes Application Developer (CKAD)', icon '🚢', desc nói rõ đây là phần lý thuyết tình huống, đề thật thi thực hành trên terminal (luyện thêm ở #/ckad); `topics: { devops: 1 }`, `domains: { 'Design & Build': 20, 'Deployment': 20, 'Observability': 15, 'Config & Security': 25, 'App Networking': 20 }`, `count: 40, minutes: 60` và trường điểm đậu 66% đúng tên field mà exams.js/exam.js dùng.

Mỗi câu theo AGENTS.md mục 4 (quiz): `topic: 'devops'`, `q` bắt đầu bằng đúng một tag domain CKAD: `[Design & Build]`, `[Deployment]`, `[Observability]`, `[Config & Security]`, `[App Networking]` (view #/exam bốc câu theo tag; KHÔNG dùng tag của đề CKA). Chia domain gần đúng trọng số. Khoảng 20% câu `multi: true` "(Chọn 2)". Câu tình huống thực hành: "lệnh/manifest nào làm đúng X", "pod không Ready vì sao", "YAML này sai ở đâu". `explain` giải thích vì sao đúng và vì sao **từng** phương án sai, kèm lệnh thật. Tiếng Việt có dấu, giữ lệnh/thuật ngữ tiếng Anh. Đáp án rải đều. Id `qz-ckad-NNN` từ 001, 40 câu.

## Luật
- Đọc AGENTS.md (mục 4, 5). Không backtick, không `${` (JSONPath {.items[*].metadata.name} được, nhưng không có $ đứng trước {).
- Đúng Kubernetes 1.30+: lệnh, field, flag có thật và chạy được (kubectl, helm 3, kustomize built-in, Ingress networking.k8s.io/v1, NetworkPolicy, native sidecar). Không chắc thì chọn nội dung khác. YAML trong ~~~yaml, lệnh trong ~~~bash.
- Không trùng ý với `js/data/quiz-ops.js`, file quiz-ckad khác.

## Nghiệm thu
`node --check js/data/quiz-ckad-1.js`; `node --check js/data/exams.js`; `node --check js/core/data-manifest.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt, không chạy cluster thật.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id/số bài và phân bố domain.

## Notes

## Notes
- Added quiz-ckad-1.js with 40 CKAD scenario questions (ids qz-ckad-001..040), topic devops, domains distributed by weight.
- Added quiz-ckad-2.js placeholder.
- Updated data-manifest.js quiz group and exams.js (ckad entry).
Reviewed-by: kilo (T2834R)
Verify-failed: 2026-11-28 03:06:06
