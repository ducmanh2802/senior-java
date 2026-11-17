# T2368 — 20 thẻ thuật ngữ tiếng Anh ngân hàng/thanh toán

Status: DONE
Agent: kilo
Owns: `js/data/drills-term.js`
After: T2308

Định dạng term ở comment đầu file; grep term: để không trùng. Thêm 20 thẻ (theme tech): ledger, reconciliation, settlement, clearing, chargeback, authorization, acquirer, issuer, escrow, liquidity, collateral, amortization, compliance, AML, KYC, fraud, ledger entry, reversal, interest accrual, overdraft (bỏ term đã có, thay bằng term ngân hàng khác). say: trọng âm cho người Việt, wrong: lỗi hay gặp, example: câu dùng khi phỏng vấn.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/drills-term.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Trước: `drill-term-240` là id lớn nhất (dòng cuối trước `);`).
- Sau: thêm 20 thẻ `drill-term-241`..`drill-term-260` (tăng đúng 20): ledger, reconciliation, settlement, clearing, chargeback, acquirer, issuer, escrow, liquidity, collateral, amortization, AML, KYC, fraud, ledger entry, reversal, interest accrual, overdraft, remittance, disbursement.
- Đã bỏ các term đã có sẵn trong file: authorization (drill-term-082), compliance (drill-term-116), và dùng remittance, disbursement thay thế để đủ 20 term ngân hàng/thanh toán mới, không trùng.
- Kiểm tra: `node --check js/data/drills-term.js` OK; `node scripts/build-light-index.js` OK (có warning parse lỗi ở file khác không thuộc sở hữu: q-scenario.js, q-primer.js, quiz-ccao-2.js).
- `node scripts/validate.js` vẫn báo LỖI nhưng toàn bộ nằm ở file không thuộc sở hữu task này (q-scenario.js, q-primer.js, quiz-ccao-2.js, bugs.js, projects.js, path.js - scenario refs/parse). Không có lỗi nào liên quan đến `js/data/drills-term.js` hay `index-light.js`. Không sửa file ngoài phạm vi theo luật 3 AGENTS.md.
