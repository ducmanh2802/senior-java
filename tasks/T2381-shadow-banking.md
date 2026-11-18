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
Added 20 shadow drills: drill-shadow-307 through drill-shadow-326 (was 306, now 326). Topics: idempotency key (307-308, 324), double-entry ledger (309-310), reconciliation (311-312), core banking timeout (313-314), safe retry with backoff/jitter (315-316), outbox pattern (317-318, 325), fraud prevention (319-320, 326), audit logging (321-323).
