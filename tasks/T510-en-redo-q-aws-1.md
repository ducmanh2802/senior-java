# T510 — Dịch lại (nội dung đã sửa): q-aws-1 (11 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-aws-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-aws.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-aws-1.en.js` đã cũ: **aws-001, aws-002, aws-003, aws-004, aws-005, aws-006, aws-007, aws-008, aws-009, aws-010, aws-011**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-aws.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-aws-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-aws-1 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại toàn bộ 11 mục (aws-001 … aws-011) khớp bản tiếng Việt hiện tại trong `js/data/q-aws.js`, giữ nguyên key và chỉ dùng field `q`, `a`, `follow`.

- Mỗi entry theo cấu trúc của bản Việt: `**Summary:**` → `### Quick intuition` (ví dụ đời thường) → `### Terms` (giải thích từng thuật ngữ lần đầu xuất hiện) → `### Step by step` kèm sơ đồ `~~~text` → các mục chuyên đề/bảng → `### Common mistakes` (Symptom / How to avoid) → `### One-minute spoken answer` → `> Senior tip:`.
- Số liệu, ví dụ và sơ đồ ASCII dịch nhãn sang tiếng Anh nhưng giữ nguyên giá trị: 13 triệu request → ~45 USD Lambda vs ~35 USD Fargate; cold start 4–5 s vs < 1 s với SnapStart; 1.769 MB ≈ 1 vCPU; quorum 4/6 ghi, 3/6 đọc; 5.000 WCU / 10 partition; 95% hit rate ≈ 2 ms; RTO ~23 phút, RPO ~1 s; delay 30 s / stopTimeout 30 s / Spring timeout 20 s.
- Không dùng backtick hay `${` trong template literal; code mẫu (CRaC handler, IAM policy, S3Presigner, QueryRequest, YAML health check) giữ nguyên.
- `node scripts/check-i18n.js q-aws-1` → `OK — 11 mục đã dịch.`
- `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: check-i18n (translation, no LLM review)
