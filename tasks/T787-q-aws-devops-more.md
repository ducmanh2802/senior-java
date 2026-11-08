# T787 — 6 câu AWS cho DevOps: EKS, ECS, IAM, chi phí

Status: DONE
Notes: Added aws-041..aws-046 (EKS vs ECS, IRSA/Pod Identity, IAM evaluation, NAT/endpoint cost, cost optimization lead, secrets rotation lead). Count 40 -> 46.
Agent: kilo
Owns: `js/data/q-aws.js`
After: T729

Topic **aws** đã có 40 câu: đọc HẾT các câu hiện có, không lặp lại nội dung, chỉ đào sâu góc khác. Câu hỏi theo kiểu phỏng vấn thật ở Việt Nam 2025–2026 (công ty product, ngân hàng, outsource lớn). Thêm 6 câu, level 3 senior / 3 lead: EKS vs ECS (Fargate) chọn thế nào, IRSA/EKS Pod Identity thay access key, IAM policy evaluation (explicit deny, SCP, permission boundary) khi debug AccessDenied, NAT Gateway và chi phí data transfer (VPC endpoint để giảm), (lead) tối ưu chi phí AWS cho hệ thống Java (Savings Plans, Graviton, Spot cho worker, right-sizing), (lead) secrets và rotation (Secrets Manager vs Parameter Store, app Spring đọc lại khi rotate).

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-aws.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-aws.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
Reviewed-by: kilo (T787R)
