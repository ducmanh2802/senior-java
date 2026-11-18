# T2381 — 20 thẻ shadowing: nói về hệ thống thanh toán/ngân hàng

Status: DONE
Agent: kilo
Owns: `js/data/drills-shadow.js`
After: T2309

Định dạng shadow ở comment đầu file. Thêm 20 câu (theme tech/project), 8–25 từ, văn nói Senior khi kể về: idempotency key, ledger kép, đối soát, timeout với core, retry an toàn, outbox, chống gian lận, audit. vi: nghĩa chính xác. CHỈ chèn trước dòng ); cuối, không viết lại file.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa phần đặc tả của file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/drills-shadow.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Added 20 shadow drills: drill-shadow-306 through drill-shadow-325 (previous max was 305; +20 → 325). Only inserted before the final `);`, nothing else changed.
Topics (banking/payments, spoken Senior, 8–25 words, vi = precise meaning):
- idempotency key: 306, 307, 324
- double-entry ledger: 308, 309
- reconciliation (đối soát): 310, 311
- core banking timeout: 312, 313
- safe retry with backoff + jitter: 314, 315
- outbox pattern: 316, 317, 325
- fraud prevention: 318, 319
- audit logging: 320, 321, 322, 323

Verification of MY file (js/data/drills-shadow.js):
- node --check js/data/drills-shadow.js → OK
- Isolated drill validation replicating validate.js shadow rules (id format drill-shadow-NNN, theme, level mid|senior|lead, en/vi present, no backtick or $, en 8–25 words) → 325 drills, max shadow id 325, 0 errors.

BLOCKER (external, NOT my file): the global `node scripts/build-light-index.js` and `node scripts/validate.js` currently fail ONLY because of js/data/q-banking.js — another concurrent agent's uncommitted edit has a syntax error (stray triple-backtick code fences written inside a template literal, ~lines 419–426; the committed HEAD version parses fine). That single broken file drops all banking-* questions from window.QUESTIONS, which cascades into the bugs.js / lessons-banking.js / path.js "banking-XXX not found" errors and the "index-light.js đã cũ" message. Waited ~2.5 min and re-checked; q-banking.js was still broken (its owner may still be mid-edit).
Remediation for integrator: once q-banking.js parses again, run `node scripts/build-light-index.js` then `node scripts/validate.js` — expected OK. No drill/shadow-specific errors were reported by validate.
Reviewed-by: kilo (T2381R)
