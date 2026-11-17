# T2359 — 20 drill hỏi-đáp tiếng Anh: phỏng vấn ngân hàng/fintech

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T2332

Định dạng qa ở comment đầu file; grep q: để không trùng. Thêm 20 drill (theme tech/project/design): giải thích idempotency khi chuyển tiền, ledger kép, đối soát, xử lý timeout với core banking, chống gian lận, PCI-DSS/che dữ liệu thẻ ở mức nguyên lý, thiết kế API thanh toán, sự cố tiền bị trừ 2 lần, migrate hệ thống ngân hàng. sample 80–200 từ giọng Senior, có số liệu; phrases 3–6.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm).

## Nghiệm thu
`node --check js/data/drills-qa.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Added 20 drills: drill-qa-202 through drill-qa-221 (previous max was drill-qa-201). Topics cover: idempotent money transfers, double-entry ledger, reconciliation, core banking timeout handling, fraud prevention, PCI-DSS/card data handling, payment API design, duplicate charge incident, banking core migration, partial payment failures, high-throughput ledger, settlement file processing, refund system, currency conversion/rounding, regulatory reporting, virtual accounts, payment integration testing, subscription billing, mTLS with core banking, cross-team launch coordination.

Note: `node scripts/validate.js` reports a pre-existing syntax error in `quiz-ccao-2.js` (missing ) after argument list) which is not owned by this task. My file `drills-qa.js` passes `node --check` and `build-light-index.js` completes successfully.
