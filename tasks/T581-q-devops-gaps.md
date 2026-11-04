# T581 — 8 câu devops vào khoảng trống

Status: TODO
Agent: qoder
Owns: `js/data/q-devops.js`

q-devops.js đã có 30 câu (Dockerfile, probes, graceful shutdown, HPA, canary, CI/CD, manifest đa môi trường, logging, observability, OIDC GitHub Actions, CronJob, drain node, multi-tenant cluster…). **Đọc hết trước**. Thêm 8 câu topic devops vào khoảng trống:
1. Supply chain: SBOM (CycloneDX/Syft), scan image (Trivy/Grype), ký và verify image (cosign), chặn deploy image chưa ký.
2. Base image cho Java: distroless / jlink runtime / Alpine-musl: kích thước, debug, CVE.
3. Terraform: remote state + lock, drift, review `plan` trong PR, tách module/môi trường; sự cố hai người apply cùng lúc.
4. Linux: "Too many open files" / hết ephemeral port / TIME_WAIT tăng: chẩn đoán (ss, lsof, ulimit, /proc), sửa ở đâu.
5. DNS trong Kubernetes chậm (ndots:5, search domain, CoreDNS) làm tăng latency gọi ra ngoài: cơ chế, cách sửa.
6. QoS class, node-pressure eviction, PriorityClass; đặt requests/limits cho service Java.
7. NetworkPolicy default-deny + quản lý secret (External Secrets / Vault / Sealed Secrets) cho service thanh toán.
8. SLO, SLI, error budget, alert burn rate thay vì CPU; postmortem không đổ lỗi.
Level: 2 mid, 4 senior, 2 lead. Lệnh trong `~~~bash`, YAML trong `~~~yaml`.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-devops.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**. Trùng thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Đúng kỹ thuật với Java 17/21 (có thể nhắc 25 LTS), Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/q-devops.js`.

## Nghiệm thu
`node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
