# T2323 — 5 câu phỏng vấn nghiệp vụ ngân hàng/fintech mới

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2244

Thêm 5 câu: thiết kế ledger bút toán kép chịu tải cao (hot account, sharding số dư), đối soát (reconciliation) với ngân hàng đối tác hằng ngày, chuyển tiền liên ngân hàng có trạng thái treo (pending/timeout) và xử lý bù, chống gian lận realtime (rule + score, độ trễ), audit trail không sửa được (append-only, hash chain). Tiền dùng BigDecimal/minor units. Đúng chuẩn AGENTS.md mục 6 (Tóm tắt, ### cơ chế, code ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn, > Senior tip:, 3000–5000 ký tự). Dùng qtool.js list để không trùng ý.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm).

## Nghiệm thu
`node --check js/data/q-banking.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

Đã có sẵn 5 câu banking-057→banking-061, khớp đúng 5 chủ đề T2323:
- banking-057 (lead): thiết kế ledger bút toán kép chịu tải cao, hot account, sharding số dư
- banking-058 (senior): đối soát hàng ngày với ngân hàng đối tác
- banking-059 (senior): chuyển tiền liên ngân hàng, trạng thái treo/timeout, tra soát
- banking-060 (lead): chống gian lận real-time, rule engine + ML scoring, độ trễ
- banking-061 (lead): audit trail không sửa được, append-only, hash chain

Không cần thêm câu mới. Validate OK cho q-banking.js (lỗi còn lại ở file khác: quiz-design.js, sdlc.js, quiz-ops.js — không liên quan).Reviewed-by: kilo (T2323R)
